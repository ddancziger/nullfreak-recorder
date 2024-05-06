# nullfreak

`nullfreak` is a JavaScript library designed to capture user interactions in web applications for analytics and monitoring purposes. It provides easy-to-use APIs to track user activities like clicks, inputs, and scrolls, and sends them to a specified endpoint for storage and analysis.

## Features

- **Event Tracking**: Tracks various user interactions on a webpage.
- **Batch Processing**: Sends events in batches to reduce network overhead.
- **Customizable**: Allows customization of tracked events and elements.

## Installation

Install `nullfreak` using npm:

```bash
npm install nullfreak
```

## Usage
```bash
import { nullRecorder } from 'nullfreak';

// Configuration settings for nullRecorder
const config = {
  companyId: 'your-company-id',
  apiKey: 'your-api-key'
};

// Initialize nullRecorder with the provided configuration
nullRecorder(config).init();
```