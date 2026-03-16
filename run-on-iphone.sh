#!/bin/bash
# Run Zcare App on iPhone
# This script helps you run the app on your physical iPhone device

echo "🚀 Starting Zcare App for iPhone..."
echo ""
echo "📱 Options to run on your iPhone:"
echo ""
echo "Option 1: Using Expo Go App (Easiest)"
echo "  1. Install 'Expo Go' app from the App Store"
echo "  2. Make sure your iPhone and Mac are on the same WiFi network"
echo "  3. Scan the QR code that appears below with your iPhone camera"
echo "  4. The app will open in Expo Go"
echo ""
echo "Option 2: Connect iPhone via USB (Development Build)"
echo "  1. Connect your iPhone to Mac via USB cable"
echo "  2. Trust this computer on your iPhone when prompted"
echo "  3. Press 'i' in the Expo terminal to select your device"
echo "  4. Follow the prompts to install and run"
echo ""
echo "Starting Expo development server..."
echo "================================================"
echo ""

cd /Users/zeriab/Projects/Zcare
npx expo start
