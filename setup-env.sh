#!/bin/bash

# DeerFlow Environment Setup Script
# This script helps you set up the required environment files for DeerFlow

echo "🦌 DeerFlow Environment Setup"
echo "=============================="

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Do you want to overwrite it? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled. Existing .env file preserved."
        exit 0
    fi
fi

# Copy the environment template
if [ -f "env.example.txt" ]; then
    cp env.example.txt .env
    echo "✅ Created .env file from template"
else
    echo "❌ env.example.txt not found. Please make sure you're in the DeerFlow root directory."
    exit 1
fi

# Check if conf.yaml exists
if [ ! -f "conf.yaml" ]; then
    if [ -f "conf.yaml.example" ]; then
        cp conf.yaml.example conf.yaml
        echo "✅ Created conf.yaml file from template"
    else
        echo "⚠️  conf.yaml.example not found"
    fi
fi

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your API keys:"
echo "   - OPENROUTER_API_KEY (required for LLM models)"
echo "   - TAVILY_API_KEY (required for web search)"
echo "   - Other optional keys as needed"
echo ""
echo "2. Edit conf.yaml and configure your LLM models"
echo ""
echo "3. Run DeerFlow:"
echo "   For development: uv run main.py"
echo "   For Docker: docker compose up"
echo ""
echo "📖 For more details, see the README.md file" 