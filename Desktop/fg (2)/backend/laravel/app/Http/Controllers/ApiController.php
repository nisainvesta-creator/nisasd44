<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ApiController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'message' => 'Welcome to Laravel API',
            'status' => 'success'
        ]);
    }

    public function getData(Request $request): JsonResponse
    {
        // Example API endpoint that can be called from React
        return response()->json([
            'data' => [
                'id' => 1,
                'name' => 'Sample Data',
                'timestamp' => now()->toISOString()
            ],
            'status' => 'success'
        ]);
    }

    public function postData(Request $request): JsonResponse
    {
        // Example POST endpoint
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email'
        ]);

        return response()->json([
            'message' => 'Data received successfully',
            'data' => $validated,
            'status' => 'success'
        ], 201);
    }
}