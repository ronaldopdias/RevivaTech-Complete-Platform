/**
 * API Documentation Route
 * Serves OpenAPI/Swagger documentation for the RevivaTech API
 */

import { NextRequest, NextResponse } from 'next/server';
import { openApiSpec } from './openapi-spec';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Get OpenAPI specification
 *     description: Returns the complete OpenAPI specification for the RevivaTech API
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 openapi:
 *                   type: string
 *                   example: "3.0.0"
 *                 info:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "RevivaTech API"
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     description:
 *                       type: string
 *                       example: "Professional computer repair booking and management API"
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(openApiSpec, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Error serving API documentation:', error);
    return NextResponse.json(
      {
        error: 'Failed to load API documentation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/docs:
 *   options:
 *     summary: CORS preflight for API documentation
 *     description: Handles CORS preflight requests for API documentation access
 *     responses:
 *       204:
 *         description: No content - CORS preflight successful
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  });
}
