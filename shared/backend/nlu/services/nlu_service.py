#!/usr/bin/env python3
"""
RevivaTech NLU Service - Custom Natural Language Understanding
Processes user messages to extract device information and repair intents.
"""

import spacy
import json
import re
from typing import Dict, List, Tuple, Optional
import sys
import os

class RevivaTechNLU:
    def __init__(self, training_data_path: str = "/app/nlu/training_data/device_intents.json"):
        """Initialize the NLU service with spaCy model and training data."""
        try:
            # Load spaCy model
            self.nlp = spacy.load("en_core_web_md")
            print("✅ spaCy model loaded successfully")
            
            # Load training data
            with open(training_data_path, 'r') as f:
                self.training_data = json.load(f)
            print("✅ Training data loaded successfully")
            
            # Build device and problem pattern dictionaries
            self._build_pattern_dictionaries()
            print("✅ Pattern dictionaries built successfully")
            
        except Exception as e:
            print(f"❌ Error initializing NLU service: {e}")
            raise

    def _build_pattern_dictionaries(self):
        """Build optimized dictionaries for fast pattern matching."""
        self.device_patterns = {}
        self.problem_patterns = {}
        self.brand_patterns = {}
        
        # Build device patterns
        for brand_data in self.training_data["device_brands"]:
            brand = brand_data["brand"].lower()
            self.brand_patterns[brand] = brand_data["brand"]
            
            for device in brand_data["devices"]:
                device_type = device["type"].lower()
                
                # Add model patterns
                for model in device["models"]:
                    model_lower = model.lower()
                    self.device_patterns[model_lower] = {
                        "brand": brand_data["brand"],
                        "type": device["type"],
                        "model": model,
                        "confidence": 0.95
                    }
                
                # Add common patterns
                for pattern in device["common_patterns"]:
                    pattern_lower = pattern.lower()
                    self.device_patterns[pattern_lower] = {
                        "brand": brand_data["brand"],
                        "type": device["type"],
                        "model": "Generic " + device["type"],
                        "confidence": 0.8
                    }
        
        # Build problem patterns
        for category in self.training_data["problem_types"]:
            for problem in category["problems"]:
                for pattern in problem["patterns"]:
                    pattern_lower = pattern.lower()
                    self.problem_patterns[pattern_lower] = {
                        "category": category["category"],
                        "issue": problem["issue"],
                        "severity": problem["severity"],
                        "repair_time": problem["repair_time"],
                        "confidence": 0.9
                    }

    def extract_device_info(self, text: str) -> Dict:
        """Extract device information from user text."""
        text_lower = text.lower()
        best_device = None
        best_confidence = 0.0
        
        # Direct pattern matching first (highest confidence)
        for pattern, device_info in self.device_patterns.items():
            if pattern in text_lower:
                if device_info["confidence"] > best_confidence:
                    best_device = device_info.copy()
                    best_confidence = device_info["confidence"]
        
        # spaCy entity recognition as backup
        if not best_device or best_confidence < 0.7:
            doc = self.nlp(text)
            
            # Look for organization entities (brands) and product entities
            for ent in doc.ents:
                if ent.label_ in ["ORG", "PRODUCT"]:
                    ent_lower = ent.text.lower()
                    
                    # Check if it's a known brand
                    for brand in self.brand_patterns:
                        if brand in ent_lower:
                            if not best_device or best_confidence < 0.6:
                                best_device = {
                                    "brand": self.brand_patterns[brand],
                                    "type": "Unknown Device",
                                    "model": ent.text,
                                    "confidence": 0.6
                                }
                                best_confidence = 0.6
        
        return best_device or {
            "brand": "Unknown",
            "type": "Unknown Device", 
            "model": "Unknown Model",
            "confidence": 0.1
        }

    def extract_problem_info(self, text: str) -> Dict:
        """Extract problem/issue information from user text."""
        text_lower = text.lower()
        best_problem = None
        best_confidence = 0.0
        
        # Direct pattern matching
        for pattern, problem_info in self.problem_patterns.items():
            if pattern in text_lower:
                if problem_info["confidence"] > best_confidence:
                    best_problem = problem_info.copy()
                    best_confidence = problem_info["confidence"]
        
        # Keyword-based matching as backup
        if not best_problem or best_confidence < 0.7:
            doc = self.nlp(text)
            
            # Look for problem-related keywords
            problem_keywords = {
                "screen": {"category": "Screen Issues", "issue": "screen_general"},
                "battery": {"category": "Battery Issues", "issue": "battery_general"},
                "slow": {"category": "Performance Issues", "issue": "slow_performance"},
                "virus": {"category": "Software Issues", "issue": "virus_malware"},
                "broken": {"category": "Hardware Issues", "issue": "hardware_general"}
            }
            
            for token in doc:
                token_lower = token.text.lower()
                if token_lower in problem_keywords:
                    if not best_problem or best_confidence < 0.5:
                        keyword_info = problem_keywords[token_lower]
                        best_problem = {
                            "category": keyword_info["category"],
                            "issue": keyword_info["issue"],
                            "severity": "medium",
                            "repair_time": "1-3 hours",
                            "confidence": 0.5
                        }
                        best_confidence = 0.5
        
        return best_problem or {
            "category": "General",
            "issue": "unknown_issue",
            "severity": "unknown",
            "repair_time": "Assessment needed",
            "confidence": 0.1
        }

    def classify_intent(self, text: str) -> Dict:
        """Classify the user's intent from their message."""
        text_lower = text.lower()
        
        # Intent patterns with confidence scores
        intent_patterns = {
            "repair_request": {
                "patterns": ["fix", "repair", "broken", "not working", "problem", "issue", "help"],
                "confidence": 0.8
            },
            "price_inquiry": {
                "patterns": ["cost", "price", "how much", "quote", "estimate", "fee", "charge"],
                "confidence": 0.9
            },
            "time_inquiry": {
                "patterns": ["how long", "when", "time", "ready", "take", "duration"],
                "confidence": 0.85
            },
            "booking_request": {
                "patterns": ["book", "appointment", "schedule", "visit", "bring in", "drop off"],
                "confidence": 0.9
            },
            "general_inquiry": {
                "patterns": ["hello", "hi", "help", "info", "information", "about"],
                "confidence": 0.7
            }
        }
        
        best_intent = "general_inquiry"
        best_confidence = 0.3
        
        for intent, data in intent_patterns.items():
            for pattern in data["patterns"]:
                if pattern in text_lower:
                    if data["confidence"] > best_confidence:
                        best_intent = intent
                        best_confidence = data["confidence"]
        
        return {
            "intent": best_intent,
            "confidence": best_confidence
        }

    def process_message(self, message: str) -> Dict:
        """
        Main function to process a user message and extract all NLU information.
        
        Args:
            message (str): User's input message
            
        Returns:
            Dict: Complete NLU analysis including device, problem, and intent
        """
        try:
            # Extract all information
            device_info = self.extract_device_info(message)
            problem_info = self.extract_problem_info(message)
            intent_info = self.classify_intent(message)
            
            # Calculate overall confidence
            confidences = [
                device_info.get("confidence", 0),
                problem_info.get("confidence", 0),
                intent_info.get("confidence", 0)
            ]
            overall_confidence = sum(confidences) / len(confidences)
            
            # Generate response recommendations
            response_type = self._determine_response_type(overall_confidence, intent_info["intent"])
            
            return {
                "message": message,
                "device": device_info,
                "problem": problem_info,
                "intent": intent_info,
                "overall_confidence": overall_confidence,
                "response_type": response_type,
                "timestamp": self._get_timestamp(),
                "status": "success"
            }
            
        except Exception as e:
            return {
                "message": message,
                "error": str(e),
                "status": "error",
                "timestamp": self._get_timestamp()
            }

    def _determine_response_type(self, confidence: float, intent: str) -> str:
        """Determine what type of response to generate based on confidence and intent."""
        if confidence > 0.8:
            return "specific_recommendation"
        elif confidence > 0.5:
            return "clarifying_question"
        else:
            return "general_guidance"

    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format."""
        from datetime import datetime
        return datetime.now().isoformat()

    def get_repair_estimate(self, device_info: Dict, problem_info: Dict) -> Dict:
        """Generate repair estimate based on device and problem information."""
        base_costs = {
            "iPhone": {"screen": 120, "battery": 80, "other": 60},
            "MacBook": {"screen": 300, "battery": 150, "other": 100},
            "Samsung Galaxy": {"screen": 100, "battery": 70, "other": 50},
            "Generic": {"screen": 80, "battery": 60, "other": 40}
        }
        
        device_type = device_info.get("type", "Generic")
        problem_category = problem_info.get("category", "other").lower()
        
        # Map problem categories to cost categories
        cost_category = "other"
        if "screen" in problem_category:
            cost_category = "screen"
        elif "battery" in problem_category:
            cost_category = "battery"
        
        # Find matching device type or use generic
        cost_key = "Generic"
        for key in base_costs:
            if key.lower() in device_type.lower():
                cost_key = key
                break
        
        base_cost = base_costs[cost_key][cost_category]
        
        # Adjust for severity
        severity_multipliers = {
            "critical": 1.5,
            "high": 1.2,
            "medium": 1.0,
            "low": 0.8
        }
        
        severity = problem_info.get("severity", "medium")
        final_cost = int(base_cost * severity_multipliers.get(severity, 1.0))
        
        return {
            "estimated_cost": f"£{final_cost}",
            "cost_range": f"£{final_cost - 20} - £{final_cost + 40}",
            "repair_time": problem_info.get("repair_time", "1-3 hours"),
            "severity": severity,
            "confidence": min(device_info.get("confidence", 0.5) + problem_info.get("confidence", 0.5), 1.0)
        }


def main():
    """Main function for testing the NLU service."""
    if len(sys.argv) < 2:
        print("Usage: python3 nlu_service.py 'Your message here'")
        return
    
    message = " ".join(sys.argv[1:])
    
    try:
        nlu = RevivaTechNLU()
        result = nlu.process_message(message)
        print(json.dumps(result, indent=2))
        
        # If we have good confidence, also show repair estimate
        if result["overall_confidence"] > 0.6:
            estimate = nlu.get_repair_estimate(result["device"], result["problem"])
            print("\n--- Repair Estimate ---")
            print(json.dumps(estimate, indent=2))
            
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()