# Project Overview Chart Data Comparing

This project is designed to visualize chart data from various data sources, with the current implementation supporting InfluxDB.

## Getting Started

### 1. Add a New Data Source
- Navigate to the `/data-sources` page.
- Add a new data source by filling in the required inputs using information from the `docker-compose` file.
- Populate the new data source with CSV data through the CSV-upload modal. InfluxDB data can be found in the `./db_data` directory.

### 2. Create a Chart
- Go to the `/chart-editor` page.
- Input the necessary data, then proceed by clicking the **Next Step** button through the setup process.
- Once completed, the data will be visualized in a chart format, with errors marked by red dots.

### 3. Further Actions
- You can select specific parts of the chart for further analysis.
- Additionally, annotations can be added in the **Periodic View** layout.


## Project Setup

```bash
npm run shell:dev
