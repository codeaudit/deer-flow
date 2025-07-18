# This file is no longer needed. All app and middleware setup is in src/server/app.py.
# If you want a CLI entrypoint, you can use the following:

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.server.app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
