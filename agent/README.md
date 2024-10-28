# Setup and Running Instructions

1. Copy the example environment file:
   ```bash
   cp .env_example .env
   ```

2. Add your keys to the `.env` file.

3. Load the environment variables:
   ```bash
   export $(cat .env | xargs)
   ```

4. Run the application:
   ```bash
   python src/app.py
   ```