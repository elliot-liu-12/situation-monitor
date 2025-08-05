def log_error(message):
    try:
        with open("errors.log", "a") as f:
            f.write(message)
    except Exception as e:
        print(f"Logging error: {str(e)}")