#!/usr/bin/env python3
"""
RevivaTech Enhanced NLU Service - Phase 3 with Knowledge Base Integration
Combines Phase 2 device recognition with comprehensive repair knowledge base
"""

import sys
import os
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Any

# Add the current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Import Phase 2 services
from nlu_service_enhanced import RevivaTechEnhancedNLU
from knowledge_base_service import KnowledgeBaseService

class RevivaTechPhase3NLU:
    """
    Phase 3 NLU Service with Knowledge Base Integration
    
    Combines:
    - Phase 2: Enhanced device recognition and cost estimation
    - Phase 3: Comprehensive knowledge base with repair procedures
    - AI-powered diagnostic recommendations
    - Repair guidance and step-by-step instructions
    """
    
    def __init__(self):
        """Initialize Phase 3 NLU service with all components"""
        
        # Initialize Phase 2 Enhanced NLU
        self.enhanced_nlu = RevivaTechEnhancedNLU()
        
        # Initialize Knowledge Base Service
        self.knowledge_base = KnowledgeBaseService()
        
        # Performance tracking
        self.total_queries = 0
        self.knowledge_base_hits = 0
        self.average_confidence = []
        self.response_times = []
        
        print("🚀 Phase 3 NLU Service initialized with Knowledge Base integration")
    
    def process_message_with_knowledge(
        self, 
        message: str, 
        user_agent: str = None, 
        context: Dict = None
    ) -> Dict[str, Any]:
        """
        Complete Phase 3 processing with knowledge base integration
        """
        start_time = time.time()
        
        try:
            # Step 1: Run Phase 2 Enhanced NLU Analysis
            phase2_result = self.enhanced_nlu.process_message_enhanced(message, user_agent)
            
            # Step 2: Extract device and problem information
            device_info = phase2_result.get('device', {})
            problem_info = phase2_result.get('problem', {})
            
            # Step 3: Search knowledge base for relevant procedures
            kb_search_results = self.knowledge_base.search_procedures(
                device_info, 
                problem_info, 
                message
            )
            
            # Step 4: Get diagnostic recommendations
            diagnostic_recommendations = self.knowledge_base.get_diagnostic_recommendations(
                device_info, 
                problem_info
            )
            
            # Step 5: Generate enhanced AI response
            enhanced_response = self._generate_enhanced_response(
                phase2_result, 
                kb_search_results, 
                diagnostic_recommendations,
                message
            )
            
            # Step 6: Calculate comprehensive confidence scores
            confidence_metrics = self._calculate_enhanced_confidence(
                phase2_result, 
                kb_search_results, 
                diagnostic_recommendations
            )
            
            # Step 7: Compile complete Phase 3 result
            response_time = (time.time() - start_time) * 1000
            self._update_performance_metrics(response_time, confidence_metrics['overall_confidence'])
            
            phase3_result = {
                # Phase 2 Results (preserved)
                'phase2_analysis': phase2_result,
                
                # Phase 3 Knowledge Base Results
                'knowledge_base': {
                    'search_results': kb_search_results,
                    'diagnostic_recommendations': diagnostic_recommendations,
                    'total_procedures_found': kb_search_results.get('total_found', 0),
                    'knowledge_confidence': kb_search_results.get('knowledge_base_confidence', 0.0)
                },
                
                # Enhanced AI Response
                'ai_response': enhanced_response,
                
                # Comprehensive Confidence Metrics
                'confidence_metrics': confidence_metrics,
                
                # Performance and Metadata
                'performance': {
                    'response_time_ms': round(response_time, 2),
                    'phase': '3_knowledge_integrated',
                    'total_queries': self.total_queries,
                    'kb_success_rate': round((self.knowledge_base_hits / max(self.total_queries, 1)) * 100, 1),
                    'avg_confidence': round(sum(self.average_confidence) / max(len(self.average_confidence), 1), 3)
                },
                
                # Integration metadata
                'integration_status': {
                    'phase2_status': 'success',
                    'knowledge_base_status': 'success' if kb_search_results.get('total_found', 0) > 0 else 'no_match',
                    'diagnostic_status': 'success' if diagnostic_recommendations.get('total_rules_matched', 0) > 0 else 'no_match'
                },
                
                'timestamp': datetime.now().isoformat(),
                'service_version': '3.0_knowledge_integrated'
            }
            
            # Log interaction for analytics
            self._log_interaction(message, device_info, problem_info, kb_search_results, response_time)
            
            return phase3_result
            
        except Exception as e:
            return self._handle_error(message, str(e), time.time() - start_time)
    
    def _generate_enhanced_response(
        self, 
        phase2_result: Dict, 
        kb_results: Dict, 
        diagnostic_results: Dict,
        original_message: str
    ) -> Dict[str, Any]:
        """Generate comprehensive AI response with knowledge base integration"""
        
        device = phase2_result.get('device', {})
        problem = phase2_result.get('problem', {})
        repair_estimate = phase2_result.get('repair_estimate', {})
        
        # Base message from Phase 2
        base_message = f"I understand you have a {device.get('brand', 'device')} {device.get('model', '')}."
        
        # Knowledge base enhancement
        kb_procedures = kb_results.get('ranked_results', [])
        kb_confidence = kb_results.get('knowledge_base_confidence', 0.0)
        
        if kb_procedures and kb_confidence > 0.6:
            top_procedure = kb_procedures[0]
            procedure_message = f" I found a specific repair procedure: '{top_procedure['title']}' with {top_procedure['relevance_score']:.0%} relevance."
            
            # Add cost and time estimates from knowledge base
            kb_cost = top_procedure.get('estimated_cost', {})
            if kb_cost:
                cost_message = f" This repair typically costs {kb_cost.get('cost_range', 'assessment needed')} and takes approximately {top_procedure.get('estimated_time_minutes', 'unknown')} minutes."
            else:
                cost_message = f" Estimated cost: {repair_estimate.get('cost_range', 'assessment needed')}."
            
            # Add difficulty and success rate information
            difficulty_level = top_procedure.get('difficulty_level', 3)
            difficulty_text = {1: "Easy", 2: "Moderate", 3: "Intermediate", 4: "Advanced", 5: "Expert"}
            success_rate = top_procedure.get('quality_metrics', {}).get('success_rate')
            
            complexity_message = f" This is a {difficulty_text.get(difficulty_level, 'Intermediate')} level repair"
            if success_rate:
                complexity_message += f" with a {success_rate:.0f}% success rate"
            complexity_message += "."
            
            enhanced_message = base_message + procedure_message + cost_message + complexity_message
        else:
            # Fallback to Phase 2 message with knowledge base context
            enhanced_message = base_message + f" For {problem.get('category', 'this type of')} issues, we typically see {problem.get('confidence', 0):.0%} success rates. {repair_estimate.get('cost_range', 'Assessment needed')} for this repair."
        
        # Generate action recommendations
        actions = self._generate_action_recommendations(kb_procedures, diagnostic_results, device, problem)
        
        # Determine response confidence
        response_confidence = self._calculate_response_confidence(phase2_result, kb_results, diagnostic_results)
        
        return {
            'message': enhanced_message,
            'recommended_actions': actions,
            'confidence': response_confidence,
            'response_type': 'knowledge_enhanced' if kb_confidence > 0.6 else 'standard_enhanced',
            'knowledge_integration': {
                'procedures_found': len(kb_procedures),
                'top_procedure': kb_procedures[0] if kb_procedures else None,
                'diagnostic_matches': diagnostic_results.get('total_rules_matched', 0)
            },
            'next_steps': self._generate_next_steps(kb_procedures, device, problem),
            'phase': '3_knowledge_integrated'
        }
    
    def _generate_action_recommendations(
        self, 
        procedures: List[Dict], 
        diagnostics: Dict, 
        device: Dict, 
        problem: Dict
    ) -> List[str]:
        """Generate intelligent action recommendations"""
        
        actions = []
        
        if procedures:
            top_procedure = procedures[0]
            
            # Procedure-specific actions
            if top_procedure.get('relevance_score', 0) > 0.8:
                actions.append(f"Review detailed repair procedure: {top_procedure['title']}")
                
                # Add safety considerations
                safety_warnings = top_procedure.get('safety_warnings', [])
                if safety_warnings:
                    actions.append("Review safety warnings before starting repair")
                
                # Add tool/parts requirements
                tools_required = top_procedure.get('tools_required', [])
                if tools_required:
                    actions.append("Gather required tools and parts")
                
                # Add time planning
                time_estimate = top_procedure.get('estimated_time_minutes', 0)
                if time_estimate > 60:
                    actions.append(f"Plan for {time_estimate//60}+ hour repair session")
            else:
                actions.append("Get professional assessment for this repair")
        
        # Diagnostic-based actions
        diagnostic_recs = diagnostics.get('diagnostic_recommendations', [])
        if diagnostic_recs:
            actions.append("Consider diagnostic testing to confirm issue")
        
        # Device-specific actions
        brand = device.get('brand', '').lower()
        if brand == 'apple':
            actions.append("Check warranty status and Apple repair options")
        elif brand == 'samsung':
            actions.append("Consider Samsung authorized service centers")
        
        # Problem-specific actions
        problem_category = problem.get('category', '').lower()
        if 'screen' in problem_category or 'display' in problem_category:
            actions.append("Backup device data before repair")
        elif 'battery' in problem_category:
            actions.append("Monitor device for swelling or heat")
        elif 'water' in problem_category:
            actions.append("Power off immediately and seek professional help")
        
        # Default actions if no specific recommendations
        if not actions:
            actions = [
                "Describe the problem in more detail",
                "Upload photos of the issue", 
                "Book diagnostic assessment",
                "Check our service areas"
            ]
        
        return actions[:6]  # Limit to 6 actions
    
    def _generate_next_steps(
        self, 
        procedures: List[Dict], 
        device: Dict, 
        problem: Dict
    ) -> Dict[str, Any]:
        """Generate structured next steps based on analysis"""
        
        if procedures and procedures[0].get('relevance_score', 0) > 0.7:
            top_procedure = procedures[0]
            
            # Get procedure steps preview
            steps_preview = top_procedure.get('steps_preview', [])
            
            return {
                'immediate_action': 'Review repair procedure',
                'procedure_recommended': top_procedure['title'],
                'preparation_needed': True,
                'estimated_time': f"{top_procedure.get('estimated_time_minutes', 60)} minutes",
                'difficulty': top_procedure.get('difficulty_level', 3),
                'first_steps': [step.get('title', step.get('description', ''))[:100] for step in steps_preview],
                'booking_recommended': top_procedure.get('difficulty_level', 3) >= 4
            }
        else:
            return {
                'immediate_action': 'Professional assessment needed',
                'procedure_recommended': 'Diagnostic evaluation',
                'preparation_needed': False,
                'estimated_time': '20-30 minutes',
                'difficulty': 1,
                'first_steps': ['Bring device to service center', 'Describe symptoms in detail', 'Provide usage history'],
                'booking_recommended': True
            }
    
    def _calculate_enhanced_confidence(
        self, 
        phase2_result: Dict, 
        kb_results: Dict, 
        diagnostic_results: Dict
    ) -> Dict[str, float]:
        """Calculate comprehensive confidence metrics"""
        
        # Phase 2 confidence
        phase2_confidence = phase2_result.get('overall_confidence', 0.0)
        
        # Knowledge base confidence
        kb_confidence = kb_results.get('knowledge_base_confidence', 0.0)
        
        # Diagnostic confidence
        diagnostic_confidence = 0.0
        diagnostic_recs = diagnostic_results.get('diagnostic_recommendations', [])
        if diagnostic_recs:
            diagnostic_confidence = sum(rec.get('confidence', 0) for rec in diagnostic_recs) / len(diagnostic_recs)
        
        # Calculate weighted overall confidence
        # Phase 2: 40%, Knowledge Base: 40%, Diagnostics: 20%
        overall_confidence = (
            phase2_confidence * 0.4 + 
            kb_confidence * 0.4 + 
            diagnostic_confidence * 0.2
        )
        
        return {
            'phase2_confidence': round(phase2_confidence, 3),
            'knowledge_base_confidence': round(kb_confidence, 3),
            'diagnostic_confidence': round(diagnostic_confidence, 3),
            'overall_confidence': round(overall_confidence, 3),
            'confidence_level': 'high' if overall_confidence > 0.8 else 'medium' if overall_confidence > 0.6 else 'low'
        }
    
    def _calculate_response_confidence(
        self, 
        phase2_result: Dict, 
        kb_results: Dict, 
        diagnostic_results: Dict
    ) -> float:
        """Calculate confidence for AI response quality"""
        
        confidence_factors = []
        
        # Device recognition confidence
        device_confidence = phase2_result.get('device', {}).get('confidence', 0.0)
        confidence_factors.append(device_confidence)
        
        # Problem identification confidence  
        problem_confidence = phase2_result.get('problem', {}).get('confidence', 0.0)
        confidence_factors.append(problem_confidence)
        
        # Knowledge base match quality
        kb_procedures = kb_results.get('ranked_results', [])
        if kb_procedures:
            top_relevance = kb_procedures[0].get('relevance_score', 0.0)
            confidence_factors.append(top_relevance)
        
        # Return average confidence with minimum threshold
        if confidence_factors:
            avg_confidence = sum(confidence_factors) / len(confidence_factors)
            return max(avg_confidence, 0.3)  # Minimum 30% confidence
        else:
            return 0.5  # Default moderate confidence
    
    def _update_performance_metrics(self, response_time: float, confidence: float):
        """Update internal performance tracking"""
        self.total_queries += 1
        self.response_times.append(response_time)
        self.average_confidence.append(confidence)
        
        # Check if knowledge base was successfully used
        if confidence > 0.7:
            self.knowledge_base_hits += 1
        
        # Keep metrics arrays manageable
        if len(self.response_times) > 100:
            self.response_times = self.response_times[-50:]
        if len(self.average_confidence) > 100:
            self.average_confidence = self.average_confidence[-50:]
    
    def _log_interaction(
        self, 
        message: str, 
        device_info: Dict, 
        problem_info: Dict, 
        kb_results: Dict, 
        response_time: float
    ):
        """Log interaction for analytics and improvement"""
        try:
            self.knowledge_base.log_knowledge_base_interaction(
                message, 
                device_info, 
                problem_info, 
                kb_results.get('ranked_results', []), 
                response_time
            )
        except Exception as e:
            print(f"Logging error: {e}")
    
    def _handle_error(self, message: str, error: str, elapsed_time: float) -> Dict[str, Any]:
        """Handle errors gracefully with fallback response"""
        
        response_time = elapsed_time * 1000
        
        return {
            'error': True,
            'error_message': f"Phase 3 processing error: {error}",
            'fallback_response': {
                'message': "I encountered an issue processing your request. Please try rephrasing your question or contact our support team.",
                'recommended_actions': [
                    "Contact customer support",
                    "Try a different description",
                    "Visit our service center"
                ],
                'confidence': 0.1,
                'response_type': 'error_fallback'
            },
            'performance': {
                'response_time_ms': round(response_time, 2),
                'phase': '3_error_fallback'
            },
            'timestamp': datetime.now().isoformat(),
            'service_version': '3.0_error_handler'
        }
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get current performance statistics"""
        
        avg_response_time = sum(self.response_times) / max(len(self.response_times), 1)
        avg_confidence = sum(self.average_confidence) / max(len(self.average_confidence), 1)
        kb_hit_rate = (self.knowledge_base_hits / max(self.total_queries, 1)) * 100
        
        return {
            'total_queries': self.total_queries,
            'knowledge_base_hits': self.knowledge_base_hits,
            'kb_hit_rate_percent': round(kb_hit_rate, 1),
            'average_response_time_ms': round(avg_response_time, 2),
            'average_confidence': round(avg_confidence, 3),
            'phase': '3_knowledge_integrated'
        }

def main():
    """Main function for API usage and testing"""
    
    if len(sys.argv) < 2:
        print("Usage: python nlu_service_phase3.py '<message>' [user_agent]")
        return
    
    # Initialize Phase 3 NLU service
    phase3_nlu = RevivaTechPhase3NLU()
    
    # Process message
    message = sys.argv[1]
    user_agent = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Get Phase 3 analysis
    result = phase3_nlu.process_message_with_knowledge(message, user_agent)
    
    # Output clean JSON for API consumption
    print(json.dumps(result, indent=2, default=str))

if __name__ == "__main__":
    main()