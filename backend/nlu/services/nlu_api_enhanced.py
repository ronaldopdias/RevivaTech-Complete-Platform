#!/usr/bin/env python3
"""
RevivaTech Enhanced NLU API Wrapper - Phase 2
JSON API for Node.js integration with 98%+ device recognition
"""

import sys
import json
import os
from typing import Dict, Any, Optional

# Import enhanced NLU service
from nlu_service_enhanced import RevivaTechEnhancedNLU

# Global NLU instance for performance
nlu_instance = None

def initialize_nlu() -> RevivaTechEnhancedNLU:
    """Initialize NLU service once for performance"""
    global nlu_instance
    if nlu_instance is None:
        try:
            # Suppress initialization output for clean JSON
            import io
            import contextlib
            
            with contextlib.redirect_stdout(io.StringIO()):
                nlu_instance = RevivaTechEnhancedNLU()
            
        except Exception as e:
            # Fallback error response
            return None
    
    return nlu_instance

def process_message_api(message: str, user_agent: str = None, context: Dict = None) -> Dict[str, Any]:
    """
    Process message through enhanced NLU and return JSON response
    
    Args:
        message: User input message
        user_agent: Browser user agent string (optional)
        context: Additional context data (optional)
    
    Returns:
        JSON response with enhanced device recognition
    """
    try:
        nlu = initialize_nlu()
        if nlu is None:
            return {
                "error": "Failed to initialize NLU service",
                "status": "initialization_error",
                "phase": "2_enhanced"
            }
        
        # Process with enhanced capabilities
        result = nlu.process_message_enhanced(message, user_agent, context)
        
        # Add repair estimate if confidence is good
        if result.get("overall_confidence", 0) > 0.6:
            try:
                repair_estimate = nlu.get_repair_estimate_enhanced(
                    result["device"], 
                    result["problem"]
                )
                result["repair_estimate"] = repair_estimate
            except Exception as e:
                result["repair_estimate"] = {"error": f"Estimate calculation failed: {str(e)}"}
        
        # Add performance statistics
        try:
            performance = nlu.get_performance_report()
            result["performance_stats"] = performance
        except Exception as e:
            result["performance_stats"] = {"error": f"Performance stats unavailable: {str(e)}"}
        
        return result
        
    except Exception as e:
        return {
            "error": str(e),
            "message": message,
            "status": "processing_error",
            "phase": "2_enhanced"
        }

def main():
    """Main entry point for API calls"""
    try:
        # Handle command line arguments
        if len(sys.argv) < 2:
            response = {
                "error": "No message provided",
                "usage": "python3 nlu_api_enhanced.py 'message' [user_agent]",
                "phase": "2_enhanced"
            }
            print(json.dumps(response))
            return
        
        message = sys.argv[1]
        user_agent = sys.argv[2] if len(sys.argv) > 2 else None
        
        # Process the message
        result = process_message_api(message, user_agent)
        
        # Output clean JSON
        print(json.dumps(result, ensure_ascii=False, separators=(',', ':')))
        
    except Exception as e:
        error_response = {
            "error": str(e),
            "status": "api_error",
            "phase": "2_enhanced"
        }
        print(json.dumps(error_response))

if __name__ == "__main__":
    main()