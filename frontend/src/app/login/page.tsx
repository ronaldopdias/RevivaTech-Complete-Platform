'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { Shield, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/client';
import { UserRole } from '@/lib/auth/types';

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin } = useAuth();

  // Let AuthContext handle ALL redirects - no interference from login page
  // useEffect removed to prevent conflicts with AuthContext redirect logic

  const handleLoginSuccess = () => {
    // AuthContext login method will handle the role-based redirection
    // No additional redirect needed here
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #082F49 0%, #0C4A6E 25%, #075985 50%, #0369A1 75%, #134E4A 100%)'
    }}>
      {/* Simple Gradient Background */}
      
      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Brand Content */}
          <div className="text-center lg:text-left text-white space-y-8">
            {/* Back Link */}
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
            
            {/* Brand Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-display font-bold">RevivaTech</h1>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-display font-bold leading-tight">
                Welcome Back to
                <span className="block bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                  Your Tech Portal
                </span>
              </h2>
              
              <p className="text-xl text-white/80 font-body max-w-md mx-auto lg:mx-0">
                Access your repair dashboard, track your devices, and manage your account.
              </p>
            </div>
            
            {/* Trust Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-white/90">Secure & Encrypted</span>
              </div>
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-white/90">Real-time Updates</span>
              </div>
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-white/90">24/7 Support</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto lg:mx-0">
              <div className="glassmorphism rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">50k+</div>
                <div className="text-sm text-white/70">Happy Customers</div>
              </div>
              <div className="glassmorphism rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">4.9★</div>
                <div className="text-sm text-white/70">Customer Rating</div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Login Form */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <LoginForm 
                className="bg-white shadow-2xl border border-gray-200" 
                onSuccess={handleLoginSuccess}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-pulse" />
      <div className="absolute top-40 right-20 w-3 h-3 bg-purple-400 rounded-full opacity-40 animate-pulse" />
      <div className="absolute bottom-32 left-20 w-2 h-2 bg-green-400 rounded-full opacity-50 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-4 h-4 bg-blue-300 rounded-full opacity-30 animate-pulse" />
    </div>
  );
}