"""
RevivaTech Phase 4 - Machine Learning Recommendation Service
Simple ML-based recommendation system using mathematical similarity algorithms
"""

import json
import time
import logging
import math
import random
from decimal import Decimal
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, timedelta
from .knowledge_base_service import KnowledgeBaseService
from .nlu_service_phase3 import RevivaTechPhase3NLU

class DecimalEncoder(json.JSONEncoder):
    """JSON encoder that handles Decimal types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

class MLRecommendationService:
    """
    Machine Learning Enhanced Recommendation System
    Uses mathematical similarity algorithms and user behavior analysis
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.knowledge_base = KnowledgeBaseService()
        self.phase3_nlu = RevivaTechPhase3NLU()
        
        # Recommendation configuration
        self.recommendation_config = {
            'max_recommendations': 5,
            'similarity_threshold': 0.3,
            'user_behavior_weight': 0.4,
            'device_compatibility_weight': 0.3,
            'procedure_popularity_weight': 0.3,
            'confidence_boost_threshold': 0.8
        }
        
        # Feature weights for scoring
        self.feature_weights = {
            'device_match': 0.35,
            'problem_category': 0.25,
            'difficulty_appropriateness': 0.15,
            'user_context': 0.15,
            'recent_success_rate': 0.10
        }
        
        # User context categories
        self.user_skill_levels = {
            'beginner': {'max_difficulty': 2, 'boost_simple': 0.2},
            'intermediate': {'max_difficulty': 4, 'boost_simple': 0.1},
            'expert': {'max_difficulty': 5, 'boost_simple': 0.0},
            'professional': {'max_difficulty': 5, 'boost_simple': -0.1}
        }
        
        self.logger.info("🤖 ML Recommendation Service initialized")
    
    def get_enhanced_recommendations(self, 
                                   message: str, 
                                   user_context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Get ML-enhanced procedure recommendations with personalization
        
        Args:
            message: User's repair request
            user_context: User skill level, preferences, history
            
        Returns:
            Enhanced recommendations with ML scoring
        """
        start_time = time.time()
        
        try:
            # Get base Phase 3 analysis
            phase3_result = self.phase3_nlu.process_message_with_knowledge(message)
            
            if not phase3_result or 'knowledge_base' not in phase3_result:
                return self._create_error_response("Phase 3 analysis failed", start_time)
            
            # Extract device and problem information
            device_info = phase3_result.get('phase2_analysis', {}).get('device', {})
            problem_info = phase3_result.get('phase2_analysis', {}).get('problem', {})
            
            # Get all relevant procedures from knowledge base
            procedures = self._get_candidate_procedures(device_info, problem_info)
            
            if not procedures:
                return self._create_no_results_response(phase3_result, start_time)
            
            # Apply ML-enhanced scoring
            scored_procedures = self._apply_ml_scoring(
                procedures, device_info, problem_info, user_context
            )
            
            # Generate personalized recommendations
            recommendations = self._generate_recommendations(
                scored_procedures, user_context
            )
            
            # Calculate overall confidence
            ml_confidence = self._calculate_ml_confidence(recommendations, user_context)
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'phase3_baseline': phase3_result,
                'ml_enhanced_recommendations': recommendations,
                'ml_confidence': ml_confidence,
                'personalization': self._get_personalization_details(user_context),
                'performance': {
                    'response_time_ms': round(response_time, 2),
                    'procedures_analyzed': len(procedures),
                    'recommendations_generated': len(recommendations),
                    'ml_enhancement_time_ms': round((time.time() - start_time) * 1000 - 
                                                   phase3_result.get('performance', {}).get('response_time_ms', 0), 2)
                },
                'phase': '4_ml_enhanced',
                'timestamp': datetime.now().isoformat(),
                'status': 'success'
            }
            
        except Exception as e:
            self.logger.error(f"ML recommendation error: {str(e)}")
            return self._create_error_response(f"ML processing failed: {str(e)}", start_time)
    
    def _get_candidate_procedures(self, device_info: Dict, problem_info: Dict) -> List[Dict]:
        """Get candidate procedures from knowledge base"""
        try:
            # Use the same method signature as Phase 3 knowledge base search
            # The search_procedures method takes device_info and problem_info as separate parameters
            
            # Build search text from the problem and device info
            search_keywords = []
            if device_info.get('brand'):
                search_keywords.append(device_info['brand'])
            if device_info.get('model'):
                search_keywords.append(device_info['model'])
            if problem_info.get('category'):
                search_keywords.append(problem_info['category'])
            
            search_text = ' '.join(search_keywords).lower()
            
            # Call knowledge base service with correct parameters
            results = self.knowledge_base.search_procedures(
                device_info=device_info,
                problem_info=problem_info,
                search_text=search_text
            )
            
            # Return the ranked results
            candidate_procedures = results.get('ranked_results', [])
            
            # Log for debugging
            self.logger.info(f"ML search found {len(candidate_procedures)} candidate procedures")
            if candidate_procedures:
                self.logger.info(f"Top candidate: {candidate_procedures[0].get('title', 'Unknown')}")
            
            return candidate_procedures
            
        except Exception as e:
            self.logger.error(f"Error getting candidate procedures: {str(e)}")
            return []
    
    def _apply_ml_scoring(self, 
                         procedures: List[Dict], 
                         device_info: Dict, 
                         problem_info: Dict,
                         user_context: Optional[Dict]) -> List[Dict]:
        """Apply machine learning enhanced scoring to procedures"""
        
        scored_procedures = []
        
        for procedure in procedures:
            try:
                # Calculate feature scores
                device_score = self._calculate_device_similarity(procedure, device_info)
                problem_score = self._calculate_problem_similarity(procedure, problem_info)
                difficulty_score = self._calculate_difficulty_appropriateness(procedure, user_context)
                user_score = self._calculate_user_context_score(procedure, user_context)
                success_score = self._calculate_success_rate_score(procedure)
                
                # Weighted combination
                ml_score = (
                    device_score * self.feature_weights['device_match'] +
                    problem_score * self.feature_weights['problem_category'] +
                    difficulty_score * self.feature_weights['difficulty_appropriateness'] +
                    user_score * self.feature_weights['user_context'] +
                    success_score * self.feature_weights['recent_success_rate']
                )
                
                # Add ML enhancement data
                procedure['ml_enhancement'] = {
                    'ml_score': round(ml_score, 4),
                    'feature_scores': {
                        'device_similarity': round(device_score, 3),
                        'problem_similarity': round(problem_score, 3),
                        'difficulty_appropriateness': round(difficulty_score, 3),
                        'user_context_match': round(user_score, 3),
                        'success_rate': round(success_score, 3)
                    },
                    'confidence_level': self._get_confidence_level(ml_score),
                    'recommendation_reasons': self._generate_recommendation_reasons(
                        device_score, problem_score, difficulty_score, user_score, success_score
                    )
                }
                
                scored_procedures.append(procedure)
                
            except Exception as e:
                self.logger.error(f"Error scoring procedure {procedure.get('id', 'unknown')}: {str(e)}")
                continue
        
        # Sort by ML score
        return sorted(scored_procedures, key=lambda x: x['ml_enhancement']['ml_score'], reverse=True)
    
    def _calculate_device_similarity(self, procedure: Dict, device_info: Dict) -> float:
        """Calculate device similarity score"""
        try:
            proc_device = procedure.get('device_compatibility', {})
            
            # Brand match (most important)
            brand_match = 1.0 if (device_info.get('brand', '').lower() in 
                                proc_device.get('brands', '').lower()) else 0.0
            
            # Type match
            type_match = 1.0 if (device_info.get('type', '').lower() in 
                               proc_device.get('device_types', '').lower()) else 0.0
            
            # Model similarity (fuzzy matching)
            model_similarity = self._calculate_model_similarity(
                device_info.get('model', ''), 
                proc_device.get('models', '')
            )
            
            # Weighted combination
            return (brand_match * 0.5 + type_match * 0.3 + model_similarity * 0.2)
            
        except Exception:
            return 0.0
    
    def _calculate_problem_similarity(self, procedure: Dict, problem_info: Dict) -> float:
        """Calculate problem similarity score"""
        try:
            proc_problem = procedure.get('problem_category', '').lower()
            user_problem = problem_info.get('category', '').lower()
            
            # Exact match
            if proc_problem == user_problem:
                return 1.0
            
            # Partial match using keyword overlap
            proc_keywords = set(proc_problem.split())
            user_keywords = set(user_problem.split())
            
            if proc_keywords and user_keywords:
                overlap = len(proc_keywords.intersection(user_keywords))
                union = len(proc_keywords.union(user_keywords))
                return overlap / union if union > 0 else 0.0
            
            return 0.0
            
        except Exception:
            return 0.0
    
    def _calculate_difficulty_appropriateness(self, procedure: Dict, user_context: Optional[Dict]) -> float:
        """Calculate if procedure difficulty matches user skill level"""
        try:
            procedure_difficulty = procedure.get('difficulty_level', 3)
            
            if not user_context:
                return 0.7  # Neutral score for unknown users
            
            user_skill = user_context.get('skill_level', 'intermediate')
            skill_config = self.user_skill_levels.get(user_skill, self.user_skill_levels['intermediate'])
            
            max_difficulty = skill_config['max_difficulty']
            
            # Score based on appropriateness
            if procedure_difficulty <= max_difficulty:
                # Appropriate difficulty
                score = 1.0 - (procedure_difficulty - 1) / max_difficulty * 0.3
                return max(score, 0.6)
            else:
                # Too difficult
                over_difficulty = procedure_difficulty - max_difficulty
                return max(0.3 - over_difficulty * 0.1, 0.0)
                
        except Exception:
            return 0.5
    
    def _calculate_user_context_score(self, procedure: Dict, user_context: Optional[Dict]) -> float:
        """Calculate user context matching score"""
        try:
            if not user_context:
                return 0.5  # Neutral for unknown users
            
            score = 0.5  # Base score
            
            # Skill level bonus
            skill_level = user_context.get('skill_level', 'intermediate')
            if skill_level in ['expert', 'professional']:
                score += 0.2  # Bonus for advanced procedures
            
            # Preference matching
            preferences = user_context.get('preferences', {})
            if preferences.get('quick_repairs') and procedure.get('estimated_time_hours', 4) <= 2:
                score += 0.2
            
            if preferences.get('detailed_guides') and len(procedure.get('steps', [])) >= 8:
                score += 0.1
            
            return min(score, 1.0)
            
        except Exception:
            return 0.5
    
    def _calculate_success_rate_score(self, procedure: Dict) -> float:
        """Calculate success rate score (simulated for now)"""
        try:
            # For now, use difficulty as inverse success rate indicator
            difficulty = procedure.get('difficulty_level', 3)
            base_success_rate = max(0.95 - (difficulty - 1) * 0.1, 0.7)
            
            # Add some randomness to simulate real data
            import random
            variation = random.uniform(-0.05, 0.05)
            
            return max(min(base_success_rate + variation, 1.0), 0.0)
            
        except Exception:
            return 0.8
    
    def _calculate_model_similarity(self, user_model: str, proc_models: str) -> float:
        """Calculate model name similarity"""
        try:
            if not user_model or not proc_models:
                return 0.0
            
            user_model = user_model.lower()
            proc_models = proc_models.lower()
            
            # Exact match
            if user_model in proc_models:
                return 1.0
            
            # Partial match using common words
            user_words = set(user_model.split())
            proc_words = set(proc_models.split())
            
            if user_words and proc_words:
                overlap = len(user_words.intersection(proc_words))
                return overlap / len(user_words) if user_words else 0.0
            
            return 0.0
            
        except Exception:
            return 0.0
    
    def _generate_recommendations(self, scored_procedures: List[Dict], user_context: Optional[Dict]) -> List[Dict]:
        """Generate final recommendations with explanations"""
        recommendations = []
        max_recommendations = self.recommendation_config['max_recommendations']
        
        for i, procedure in enumerate(scored_procedures[:max_recommendations]):
            try:
                ml_data = procedure.get('ml_enhancement', {})
                
                recommendation = {
                    'procedure_id': procedure.get('id'),
                    'title': procedure.get('title'),
                    'difficulty_level': procedure.get('difficulty_level'),
                    'estimated_time': procedure.get('estimated_time_hours'),
                    'ml_score': ml_data.get('ml_score', 0.0),
                    'confidence_level': ml_data.get('confidence_level', 'medium'),
                    'recommendation_rank': i + 1,
                    'explanation': self._generate_explanation(procedure, user_context),
                    'feature_scores': ml_data.get('feature_scores', {}),
                    'recommendation_reasons': ml_data.get('recommendation_reasons', []),
                    'estimated_cost': procedure.get('cost_estimate', {}),
                    'success_probability': ml_data.get('feature_scores', {}).get('success_rate', 0.8)
                }
                
                recommendations.append(recommendation)
                
            except Exception as e:
                self.logger.error(f"Error generating recommendation: {str(e)}")
                continue
        
        return recommendations
    
    def _generate_explanation(self, procedure: Dict, user_context: Optional[Dict]) -> str:
        """Generate explanation for why this procedure was recommended"""
        try:
            ml_data = procedure.get('ml_enhancement', {})
            scores = ml_data.get('feature_scores', {})
            
            explanations = []
            
            # Device compatibility
            if scores.get('device_similarity', 0) > 0.8:
                explanations.append("Excellent device compatibility")
            elif scores.get('device_similarity', 0) > 0.6:
                explanations.append("Good device match")
            
            # Problem relevance
            if scores.get('problem_similarity', 0) > 0.8:
                explanations.append("Highly relevant to your problem")
            
            # Difficulty appropriateness
            if user_context and scores.get('difficulty_appropriateness', 0) > 0.8:
                skill_level = user_context.get('skill_level', 'intermediate')
                explanations.append(f"Appropriate for {skill_level} skill level")
            
            # Success rate
            if scores.get('success_rate', 0) > 0.9:
                explanations.append("High success rate")
            
            return "; ".join(explanations) if explanations else "Recommended based on ML analysis"
            
        except Exception:
            return "AI-recommended procedure"
    
    def _generate_recommendation_reasons(self, device_score: float, problem_score: float, 
                                       difficulty_score: float, user_score: float, 
                                       success_score: float) -> List[str]:
        """Generate specific reasons for recommendation"""
        reasons = []
        
        if device_score > 0.8:
            reasons.append("Excellent device compatibility")
        if problem_score > 0.8:
            reasons.append("Perfect problem match")
        if difficulty_score > 0.8:
            reasons.append("Appropriate difficulty level")
        if success_score > 0.9:
            reasons.append("High success rate")
        if user_score > 0.7:
            reasons.append("Matches user preferences")
        
        return reasons
    
    def _calculate_ml_confidence(self, recommendations: List[Dict], user_context: Optional[Dict]) -> Dict[str, Any]:
        """Calculate overall ML confidence metrics"""
        try:
            if not recommendations:
                return {
                    'overall_confidence': 0.0,
                    'confidence_level': 'low',
                    'recommendation_quality': 'poor'
                }
            
            # Calculate average ML score
            scores = [rec.get('ml_score', 0.0) for rec in recommendations]
            avg_score = sum(scores) / len(scores) if scores else 0.0
            
            # Calculate confidence level
            if avg_score >= 0.8:
                confidence_level = 'very_high'
            elif avg_score >= 0.7:
                confidence_level = 'high'
            elif avg_score >= 0.5:
                confidence_level = 'medium'
            elif avg_score >= 0.3:
                confidence_level = 'low'
            else:
                confidence_level = 'very_low'
            
            # Personalization boost
            personalization_boost = 0.1 if user_context else 0.0
            
            final_confidence = min(avg_score + personalization_boost, 1.0)
            
            return {
                'overall_confidence': round(final_confidence, 4),
                'confidence_level': confidence_level,
                'average_ml_score': round(avg_score, 4),
                'recommendation_count': len(recommendations),
                'personalization_applied': bool(user_context),
                'quality_indicators': {
                    'top_recommendation_score': recommendations[0].get('ml_score', 0.0) if recommendations else 0.0,
                    'score_variance': round(self._calculate_variance([rec.get('ml_score', 0.0) for rec in recommendations]), 4),
                    'coverage_breadth': len(set(rec.get('difficulty_level', 0) for rec in recommendations))
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error calculating ML confidence: {str(e)}")
            return {
                'overall_confidence': 0.5,
                'confidence_level': 'medium',
                'error': str(e)
            }
    
    def _get_personalization_details(self, user_context: Optional[Dict]) -> Dict[str, Any]:
        """Get personalization details applied"""
        if not user_context:
            return {
                'applied': False,
                'reason': 'No user context provided'
            }
        
        return {
            'applied': True,
            'user_skill_level': user_context.get('skill_level', 'unknown'),
            'preferences_considered': list(user_context.get('preferences', {}).keys()),
            'personalization_factors': [
                'Skill level matching',
                'Difficulty appropriateness',
                'User preference alignment'
            ]
        }
    
    def _calculate_variance(self, values: List[float]) -> float:
        """Calculate variance of a list of values"""
        if not values:
            return 0.0
        
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return variance
    
    def _get_confidence_level(self, score: float) -> str:
        """Convert numeric score to confidence level"""
        if score >= 0.8:
            return 'very_high'
        elif score >= 0.7:
            return 'high'
        elif score >= 0.5:
            return 'medium'
        elif score >= 0.3:
            return 'low'
        else:
            return 'very_low'
    
    def _create_error_response(self, error_msg: str, start_time: float) -> Dict[str, Any]:
        """Create error response"""
        return {
            'error': True,
            'error_message': error_msg,
            'phase': '4_ml_error',
            'response_time_ms': round((time.time() - start_time) * 1000, 2),
            'timestamp': datetime.now().isoformat()
        }
    
    def _create_no_results_response(self, phase3_result: Dict, start_time: float) -> Dict[str, Any]:
        """Create no results response"""
        return {
            'phase3_baseline': phase3_result,
            'ml_enhanced_recommendations': [],
            'ml_confidence': {
                'overall_confidence': 0.0,
                'confidence_level': 'none',
                'reason': 'No candidate procedures found'
            },
            'performance': {
                'response_time_ms': round((time.time() - start_time) * 1000, 2),
                'procedures_analyzed': 0,
                'recommendations_generated': 0
            },
            'phase': '4_ml_no_results',
            'timestamp': datetime.now().isoformat(),
            'status': 'no_results'
        }