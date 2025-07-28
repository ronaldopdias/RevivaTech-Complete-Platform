#!/usr/bin/env python3
"""
RevivaTech NLU API Wrapper - JSON-only output for Node.js integration
"""

import sys
import json
import os

# Add the services directory to path
sys.path.append('/app/nlu/services')

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Message is required", "status": "error"}))
        return
    
    message = " ".join(sys.argv[1:])
    
    try:
        # Import and initialize the NLU service quietly
        from nlu_service import RevivaTechNLU
        
        # Suppress ALL output during initialization
        import io
        old_stdout = sys.stdout
        old_stderr = sys.stderr
        sys.stdout = io.StringIO()
        sys.stderr = io.StringIO()
        
        nlu = RevivaTechNLU()
        
        # Restore output
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        
        # Process the message
        result = nlu.process_message(message)
        
        # Add repair estimate if confidence is good
        if result.get("overall_confidence", 0) > 0.6 and result.get("status") == "success":
            estimate = nlu.get_repair_estimate(result["device"], result["problem"])
            result["repair_estimate"] = estimate
        
        # Output only JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "status": "error",
            "timestamp": __import__('datetime').datetime.now().isoformat()
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()