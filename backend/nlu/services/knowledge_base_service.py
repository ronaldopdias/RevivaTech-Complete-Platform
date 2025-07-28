#!/usr/bin/env python3
"""
RevivaTech Knowledge Base Service - Phase 3
Integrates repair knowledge base with device recognition and NLU processing
"""

import json
import logging
import time
from typing import Dict, List, Optional, Tuple, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import difflib
from datetime import datetime

# Suppress initialization output for clean API communication
logging.basicConfig(level=logging.ERROR, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

class KnowledgeBaseService:
    """
    Advanced knowledge base service for repair procedure recommendations
    """
    
    def __init__(self):
        """Initialize knowledge base service with database connection"""
        self.db_config = {
            'host': 'revivatech_new_database',
            'port': 5432,
            'database': 'revivatech_new',
            'user': 'revivatech_user',
            'password': 'revivatech_password'
        }
        self.connection = None
        self._connect_database()
        
        # Performance tracking
        self.query_count = 0
        self.total_response_time = 0
        self.cache = {}
        
        logger.error("✅ Knowledge Base Service initialized")
    
    def _connect_database(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(**self.db_config)
            logger.error("📊 Database connection established")
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            self.connection = None
    
    def _execute_query(self, query: str, params: Tuple = None) -> List[Dict]:
        """Execute database query with error handling"""
        if not self.connection:
            self._connect_database()
        
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params)
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"Query error: {e}")
            return []
    
    def search_procedures(
        self, 
        device_info: Dict, 
        problem_info: Dict, 
        search_text: str = ""
    ) -> Dict[str, Any]:
        """
        Search for relevant repair procedures based on device and problem
        """
        start_time = time.time()
        
        # Build search criteria
        search_criteria = self._build_search_criteria(device_info, problem_info, search_text)
        
        # Execute search queries
        procedures = self._search_procedures_database(search_criteria)
        
        # Rank and score results
        ranked_procedures = self._rank_procedures(procedures, device_info, problem_info)
        
        # Get detailed procedure information
        enhanced_results = self._enhance_procedure_results(ranked_procedures)
        
        response_time = (time.time() - start_time) * 1000
        self.query_count += 1
        self.total_response_time += response_time
        
        return {
            'search_criteria': search_criteria,
            'total_found': len(procedures),
            'ranked_results': enhanced_results,
            'search_performance': {
                'response_time_ms': round(response_time, 2),
                'total_queries': self.query_count,
                'avg_response_time': round(self.total_response_time / self.query_count, 2)
            },
            'knowledge_base_confidence': self._calculate_knowledge_confidence(enhanced_results)
        }
    
    def _build_search_criteria(
        self, 
        device_info: Dict, 
        problem_info: Dict, 
        search_text: str
    ) -> Dict:
        """Build comprehensive search criteria from input parameters"""
        
        criteria = {
            'device_brand': device_info.get('brand', ''),
            'device_model': device_info.get('model', ''),
            'device_type': device_info.get('type', ''),
            'problem_category': problem_info.get('category', ''),
            'problem_issue': problem_info.get('issue', ''),
            'search_keywords': search_text.lower().split(),
            'difficulty_max': 5,  # Default to all difficulty levels
            'status_filter': 'published'
        }
        
        # Extract additional search terms from problem description
        if 'description' in problem_info:
            criteria['search_keywords'].extend(problem_info['description'].lower().split())
        
        return criteria
    
    def _search_procedures_database(self, criteria: Dict) -> List[Dict]:
        """Execute database search with multiple matching strategies"""
        
        # Strategy 1: Exact device and problem match
        exact_match_query = """
        SELECT rp.*, 
               ts_rank(to_tsvector('english', rp.title || ' ' || rp.description || ' ' || COALESCE(rp.overview, '')), 
                       plainto_tsquery('english', %s)) as search_rank
        FROM repair_procedures rp
        WHERE rp.status = %s
          AND (rp.device_compatibility->>'brands')::jsonb ? %s
          AND (%s = ANY(rp.problem_categories) OR %s = ANY(rp.diagnostic_tags))
        ORDER BY search_rank DESC, rp.quality_score DESC NULLS LAST
        LIMIT 10
        """
        
        search_terms = ' '.join(criteria['search_keywords'])
        exact_results = self._execute_query(
            exact_match_query, 
            (search_terms, criteria['status_filter'], criteria['device_brand'], 
             criteria['problem_category'], criteria['problem_issue'])
        )
        
        # Strategy 2: Fuzzy device match with problem keywords
        fuzzy_match_query = """
        SELECT rp.*, 
               ts_rank(to_tsvector('english', rp.title || ' ' || rp.description || ' ' || COALESCE(rp.overview, '')), 
                       plainto_tsquery('english', %s)) as search_rank,
               'fuzzy_match' as match_type
        FROM repair_procedures rp
        WHERE rp.status = %s
          AND to_tsvector('english', rp.title || ' ' || rp.description) @@ plainto_tsquery('english', %s)
        ORDER BY search_rank DESC, rp.quality_score DESC NULLS LAST
        LIMIT 15
        """
        
        fuzzy_results = self._execute_query(
            fuzzy_match_query,
            (search_terms, criteria['status_filter'], search_terms)
        )
        
        # Strategy 3: Generic procedures for device type
        generic_query = """
        SELECT rp.*, 0.5 as search_rank, 'generic_match' as match_type
        FROM repair_procedures rp
        WHERE rp.status = %s
          AND (rp.device_compatibility->>'types')::jsonb ? %s
        ORDER BY rp.quality_score DESC NULLS LAST, rp.view_count DESC
        LIMIT 5
        """
        
        generic_results = self._execute_query(
            generic_query,
            (criteria['status_filter'], criteria['device_type'])
        )
        
        # Combine and deduplicate results
        all_results = exact_results + fuzzy_results + generic_results
        seen_ids = set()
        unique_results = []
        
        for result in all_results:
            if result['id'] not in seen_ids:
                seen_ids.add(result['id'])
                unique_results.append(result)
        
        return unique_results
    
    def _rank_procedures(
        self, 
        procedures: List[Dict], 
        device_info: Dict, 
        problem_info: Dict
    ) -> List[Dict]:
        """Apply intelligent ranking to procedure results"""
        
        for procedure in procedures:
            score = 0.0
            
            # Device compatibility scoring (40% weight)
            device_score = self._score_device_compatibility(procedure, device_info)
            score += device_score * 0.4
            
            # Problem relevance scoring (30% weight)
            problem_score = self._score_problem_relevance(procedure, problem_info)
            score += problem_score * 0.3
            
            # Quality and reliability scoring (20% weight)
            quality_score = self._score_quality_metrics(procedure)
            score += quality_score * 0.2
            
            # Search relevance scoring (10% weight)
            search_score = float(procedure.get('search_rank', 0.0))
            score += min(search_score, 1.0) * 0.1
            
            procedure['relevance_score'] = round(score, 3)
            procedure['scoring_breakdown'] = {
                'device_compatibility': round(device_score, 3),
                'problem_relevance': round(problem_score, 3),
                'quality_metrics': round(quality_score, 3),
                'search_relevance': round(search_score, 3)
            }
        
        # Sort by relevance score
        return sorted(procedures, key=lambda x: x['relevance_score'], reverse=True)
    
    def _score_device_compatibility(self, procedure: Dict, device_info: Dict) -> float:
        """Score how well procedure matches the device"""
        compatibility = procedure.get('device_compatibility', {})
        
        if isinstance(compatibility, str):
            try:
                compatibility = json.loads(compatibility)
            except:
                compatibility = {}
        
        score = 0.0
        
        # Brand match (50% of device score)
        brands = compatibility.get('brands', [])
        if device_info.get('brand') in brands or '*' in brands:
            score += 0.5
        
        # Model match (30% of device score)
        models = compatibility.get('models', [])
        device_model = device_info.get('model', '')
        if any(model in device_model or device_model in model for model in models) or '*' in models:
            score += 0.3
        
        # Type match (20% of device score)
        types = compatibility.get('types', [])
        if device_info.get('type') in types or '*' in types:
            score += 0.2
        
        return min(score, 1.0)
    
    def _score_problem_relevance(self, procedure: Dict, problem_info: Dict) -> float:
        """Score how well procedure addresses the problem"""
        score = 0.0
        
        # Problem category match (60% of problem score)
        problem_categories = procedure.get('problem_categories', [])
        if problem_info.get('category') in problem_categories:
            score += 0.6
        
        # Issue type match (40% of problem score)
        diagnostic_tags = procedure.get('diagnostic_tags', [])
        if problem_info.get('issue') in diagnostic_tags:
            score += 0.4
        
        # Keyword relevance bonus
        keywords = procedure.get('ai_keywords', [])
        problem_text = (problem_info.get('description', '') + ' ' + 
                       problem_info.get('category', '') + ' ' + 
                       problem_info.get('issue', '')).lower()
        
        keyword_matches = sum(1 for keyword in keywords if keyword.lower() in problem_text)
        if keywords:
            keyword_bonus = min(keyword_matches / len(keywords), 0.2)
            score += keyword_bonus
        
        return min(score, 1.0)
    
    def _score_quality_metrics(self, procedure: Dict) -> float:
        """Score procedure based on quality metrics"""
        score = 0.0
        
        # Quality score (50% of quality metric)
        quality = procedure.get('quality_score')
        if quality is not None:
            score += (float(quality) / 5.0) * 0.5
        
        # Success rate (30% of quality metric)
        success_rate = procedure.get('success_rate')
        if success_rate is not None:
            score += (float(success_rate) / 100.0) * 0.3
        
        # View count popularity (20% of quality metric)
        view_count = procedure.get('view_count', 0)
        popularity_score = min(view_count / 100.0, 1.0)  # Normalize to max 100 views = 1.0
        score += popularity_score * 0.2
        
        return min(score, 1.0)
    
    def _enhance_procedure_results(self, procedures: List[Dict]) -> List[Dict]:
        """Add detailed information to procedure results"""
        enhanced = []
        
        for procedure in procedures[:5]:  # Limit to top 5 results
            # Get procedure steps
            steps_query = """
            SELECT step_number, title, description, estimated_duration_minutes, 
                   difficulty_rating, caution_level, tips_and_tricks
            FROM procedure_steps 
            WHERE procedure_id = %s 
            ORDER BY step_number
            """
            steps = self._execute_query(steps_query, (procedure['id'],))
            
            # Get feedback summary
            feedback_query = """
            SELECT AVG(rating) as avg_rating, 
                   COUNT(*) as feedback_count,
                   AVG(actual_time_minutes) as avg_actual_time,
                   COUNT(CASE WHEN was_successful THEN 1 END) as success_count
            FROM procedure_feedback 
            WHERE procedure_id = %s
            """
            feedback = self._execute_query(feedback_query, (procedure['id'],))
            feedback_summary = feedback[0] if feedback else {}
            
            enhanced_procedure = {
                'id': procedure['id'],
                'title': procedure['title'],
                'description': procedure['description'],
                'difficulty_level': procedure['difficulty_level'],
                'estimated_time_minutes': procedure['estimated_time_minutes'],
                'repair_type': procedure['repair_type'],
                'overview': procedure['overview'],
                'safety_warnings': procedure['safety_warnings'],
                'tools_required': procedure['tools_required'],
                'parts_required': procedure['parts_required'],
                'relevance_score': procedure['relevance_score'],
                'scoring_breakdown': procedure['scoring_breakdown'],
                'quality_metrics': {
                    'quality_score': procedure.get('quality_score'),
                    'success_rate': procedure.get('success_rate'),
                    'view_count': procedure.get('view_count', 0),
                    'avg_rating': float(feedback_summary.get('avg_rating', 0)) if feedback_summary.get('avg_rating') else None,
                    'feedback_count': feedback_summary.get('feedback_count', 0)
                },
                'steps_preview': steps[:3],  # First 3 steps as preview
                'total_steps': len(steps),
                'estimated_cost': self._estimate_procedure_cost(procedure),
                'recommendation_reason': self._generate_recommendation_reason(procedure)
            }
            
            enhanced.append(enhanced_procedure)
        
        return enhanced
    
    def _estimate_procedure_cost(self, procedure: Dict) -> Dict[str, Any]:
        """Estimate total cost for procedure including parts and labor"""
        parts_required = procedure.get('parts_required', [])
        if isinstance(parts_required, str):
            try:
                parts_required = json.loads(parts_required)
            except:
                parts_required = []
        
        parts_cost = 0.0
        for part in parts_required:
            if isinstance(part, dict) and 'cost_estimate' in part:
                parts_cost += float(part['cost_estimate'])
        
        # Labor cost estimation based on time and difficulty
        time_minutes = procedure.get('estimated_time_minutes', 60)
        difficulty = procedure.get('difficulty_level', 3)
        
        # Labor rate: £30-90/hour based on difficulty
        hourly_rates = {1: 30, 2: 40, 3: 50, 4: 70, 5: 90}
        labor_rate = hourly_rates.get(difficulty, 50)
        labor_cost = (time_minutes / 60.0) * labor_rate
        
        total_cost = parts_cost + labor_cost
        
        return {
            'parts_cost': round(parts_cost, 2),
            'labor_cost': round(labor_cost, 2),
            'total_cost': round(total_cost, 2),
            'cost_range': f"£{round(total_cost * 0.85, 0):.0f} - £{round(total_cost * 1.15, 0):.0f}",
            'currency': 'GBP'
        }
    
    def _generate_recommendation_reason(self, procedure: Dict) -> str:
        """Generate human-readable reason for recommendation"""
        reasons = []
        
        score_breakdown = procedure.get('scoring_breakdown', {})
        
        if score_breakdown.get('device_compatibility', 0) > 0.8:
            reasons.append("Perfect device compatibility")
        elif score_breakdown.get('device_compatibility', 0) > 0.5:
            reasons.append("Good device compatibility")
        
        if score_breakdown.get('problem_relevance', 0) > 0.8:
            reasons.append("Directly addresses your problem")
        elif score_breakdown.get('problem_relevance', 0) > 0.5:
            reasons.append("Related to your issue")
        
        quality_score = procedure.get('quality_score')
        if quality_score and float(quality_score) >= 4.5:
            reasons.append("Highly rated procedure")
        elif quality_score and float(quality_score) >= 4.0:
            reasons.append("Well-rated procedure")
        
        success_rate = procedure.get('success_rate')
        if success_rate and float(success_rate) >= 95:
            reasons.append("Very high success rate")
        elif success_rate and float(success_rate) >= 85:
            reasons.append("High success rate")
        
        if not reasons:
            reasons.append("Best available match for your device and problem")
        
        return ", ".join(reasons)
    
    def _calculate_knowledge_confidence(self, results: List[Dict]) -> float:
        """Calculate overall confidence in knowledge base recommendations"""
        if not results:
            return 0.0
        
        # Use the top result's relevance score as primary indicator
        top_score = results[0].get('relevance_score', 0.0)
        
        # Boost confidence if multiple good matches
        good_matches = sum(1 for r in results if r.get('relevance_score', 0) > 0.7)
        confidence_boost = min(good_matches * 0.05, 0.15)
        
        # Reduce confidence if no exact matches
        if all(r.get('relevance_score', 0) < 0.8 for r in results):
            confidence_penalty = 0.1
        else:
            confidence_penalty = 0.0
        
        final_confidence = min(top_score + confidence_boost - confidence_penalty, 1.0)
        return round(final_confidence, 3)
    
    def get_diagnostic_recommendations(
        self, 
        device_info: Dict, 
        problem_info: Dict
    ) -> Dict[str, Any]:
        """Get AI-powered diagnostic recommendations"""
        
        # Query diagnostic rules
        rules_query = """
        SELECT * FROM diagnostic_rules 
        WHERE %s = ANY(device_types)
          AND (%s = ANY(symptom_keywords) OR %s = ANY(symptom_keywords))
        ORDER BY priority_score DESC, success_rate DESC
        LIMIT 5
        """
        
        device_type = device_info.get('type', 'smartphone')
        problem_category = problem_info.get('category', '')
        problem_issue = problem_info.get('issue', '')
        
        diagnostic_rules = self._execute_query(
            rules_query, 
            (device_type, problem_category, problem_issue)
        )
        
        recommendations = []
        for rule in diagnostic_rules:
            # Get recommended procedures
            procedure_ids = rule.get('recommended_procedures', [])
            if procedure_ids:
                procedures_query = """
                SELECT id, title, difficulty_level, estimated_time_minutes, repair_type
                FROM repair_procedures 
                WHERE id = ANY(%s) AND status = 'published'
                """
                procedures = self._execute_query(procedures_query, (procedure_ids,))
                
                recommendations.append({
                    'rule_name': rule['rule_name'],
                    'confidence': rule['confidence_threshold'],
                    'success_rate': rule['success_rate'],
                    'recommended_procedures': procedures,
                    'priority': rule['priority_score']
                })
        
        return {
            'diagnostic_recommendations': recommendations,
            'total_rules_matched': len(diagnostic_rules),
            'confidence_level': 'high' if recommendations else 'medium'
        }
    
    def log_knowledge_base_interaction(
        self, 
        search_query: str, 
        device_info: Dict, 
        problem_info: Dict, 
        results: List[Dict],
        response_time_ms: float
    ):
        """Log knowledge base interaction for analytics"""
        try:
            log_query = """
            INSERT INTO knowledge_base_analytics 
            (event_type, search_query, device_detected, problem_detected, 
             response_time_ms, results_count, session_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            
            device_string = f"{device_info.get('brand', '')} {device_info.get('model', '')}".strip()
            problem_string = f"{problem_info.get('category', '')} - {problem_info.get('issue', '')}".strip()
            session_id = f"kb_{int(time.time())}"
            
            self._execute_query(
                log_query,
                ('search', search_query, device_string, problem_string, 
                 response_time_ms, len(results), session_id)
            )
            
            self.connection.commit()
        except Exception as e:
            logger.error(f"Failed to log interaction: {e}")

def main():
    """
    Main function for testing and API usage
    """
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python knowledge_base_service.py '<search_query>' [device_brand] [device_model] [problem_category]")
        return
    
    # Initialize service
    kb_service = KnowledgeBaseService()
    
    # Parse command line arguments
    search_query = sys.argv[1]
    device_info = {
        'brand': sys.argv[2] if len(sys.argv) > 2 else 'Unknown',
        'model': sys.argv[3] if len(sys.argv) > 3 else 'Unknown',
        'type': 'smartphone'  # Default type
    }
    problem_info = {
        'category': sys.argv[4] if len(sys.argv) > 4 else 'general',
        'issue': 'unknown',
        'description': search_query
    }
    
    # Search for procedures
    results = kb_service.search_procedures(device_info, problem_info, search_query)
    
    # Get diagnostic recommendations
    diagnostics = kb_service.get_diagnostic_recommendations(device_info, problem_info)
    
    # Output clean JSON for API consumption
    output = {
        'knowledge_base_search': results,
        'diagnostic_recommendations': diagnostics,
        'search_query': search_query,
        'device_info': device_info,
        'problem_info': problem_info,
        'timestamp': datetime.now().isoformat(),
        'service_version': '3.0_knowledge_base'
    }
    
    print(json.dumps(output, indent=2, default=str))

if __name__ == "__main__":
    main()