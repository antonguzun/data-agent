# Data Agent

Data Agent is an AI-powered tool that automatically analyzes business hypotheses using your data sources.

## Features

- 🤖 Automated data analysis
- 💬 Natural language queries
- 📊 Multiple data source support
- 🔄 Contextual understanding
- 📈 Business insights generation
- 🔒 Keep your data secure and in your control

## Demo

Watch how Data Agent works:

1. Connect your data source
2. Provide business context
3. Ask questions in natural language

https://github.com/user-attachments/assets/069427e8-ae1a-48c6-9b02-a9d0d1973191

## Quick Start

### Prerequisites

- Docker and Docker Compose
- OpenAI API key
- Tavily API key

### Installation


## Setup and Running Instructions

1. **Copy the example environment file:**
   ```bash
   cp .env_example .env
   ```

2. **Add your keys to the `.env` file:**
   - `OPENAI_API_KEY`: [Create API key](https://platform.openai.com/settings/profile/api-keys)
   - `IMPORT_TEST_DB=1`: Keep `1` if you want to create a test SQLite database with the wildfires dataset
   - `NEXT_PUBLIC_AGENT_API_URL=localhost:8000`: Keep `localhost` if you work locally, replace with your domain if you want to host it elsewhere

3. **Load the environment variables:**
   ```bash
   export $(cat .env | xargs)
   ```

4. **Launch with Docker:**
   ```bash
   docker compose up -d
   ```

5. **Access the application:**
   - **Agent UI:** Open your browser and go to `http://localhost:3000`
   - **Agent API:** The API will be available at `http://localhost:8000`


## Roadmap

### LLM Support
- [x] OpenAI integration
- [ ] Claude integration
- [ ] Llama integration

### Data Sources
- [x] SQLite support
- [x] MySQL support
- [x] PostgreSQL support
- [x] ClickHouse support

### Future Features
- [ ] Interactive data visualizations with customizable charts and graphs
- [ ] Auto-generated hypothesis testing
- [ ] Additional LLM integrations
- [ ] Contextual learning from previous research results

## Contributing

Contributions are welcome! TODO Contributing Guidelines

## License

This project is licensed under the [GNU License](LICENSE).

## Support

For issues, feature requests, or questions, please [open an issue](https://github.com/antonguzun/data-agent/issues) on our GitHub repository.
