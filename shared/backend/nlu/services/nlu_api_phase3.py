#!/usr/bin/env python3
"""
RevivaTech Phase 3 NLU API - Clean JSON wrapper
Provides clean JSON output for Node.js integration
"""

import sys
import json
import os
import warnings
import logging

# Suppress all warnings and logging for clean API output
warnings.filterwarnings('ignore')
os.environ['PYTHONWARNINGS'] = 'ignore'
logging.disable(logging.CRITICAL)

# Add path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from nlu_service_phase3 import RevivaTechPhase3NLU

def process_message_api(message, user_agent=None, context=None):
    """
    Clean API wrapper for Phase 3 NLU processing
    """
    try:
        # Initialize Phase 3 NLU service
        phase3_nlu = RevivaTechPhase3NLU()
        
        # Process message with knowledge base integration
        result = phase3_nlu.process_message_with_knowledge(message, user_agent)
        
        # Return clean JSON for API consumption
        return result
        
    except Exception as e:
        return {
            'error': True,
            'error_message': str(e),
            'fallback_response': {
                'message': 'Unable to process request. Please try again.',
                'recommended_actions': ['Contact support', 'Try rephrasing'],
                'confidence': 0.1
            },
            'phase': '3_error'
        }

def main():
    """Command line interface for testing"""
    if len(sys.argv) < 2:
        print("Usage: python nlu_api_phase3.py '<message>' [user_agent]")
        return
    
    message = sys.argv[1]
    user_agent = sys.argv[2] if len(sys.argv) > 2 else None
    
    result = process_message_api(message, user_agent)
    print(json.dumps(result, indent=2, default=str))

if __name__ == "__main__":
    main()