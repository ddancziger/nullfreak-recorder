# nullfreak

`nullfreak` is a JavaScript library designed to capture user interactions in web applications for analytics and monitoring purposes. It provides easy-to-use APIs to track user activities like clicks, inputs, and scrolls, and sends them to a specified endpoint for storage and analysis.

## Features

- **Event Tracking**: Tracks various user interactions on a webpage.
- **Batch Processing**: Sends events in batches to reduce network overhead.
- **Customizable**: Allows customization of tracked events and elements.

## Installation

Install `nullfreak` using npm:

```bash
npm install nullfreak-recorder
```

## Usage

```bash
import { nullRecorder } from 'nullfreak-recorder';;

// Configuration settings for nullRecorder
const config = {
  companyId: 'your-company-id',
  apiKey: 'your-api-key'
};

// Initialize nullRecorder with the provided configuration
nullRecorder(config);
```

## Example ReactJS

```bash
import React, { useEffect } from 'react';
import { nullRecorder } from 'nullfreak-recorder';

const App = () => {
  useEffect(() => {
    // Configuration settings
    const config = {
      companyId: 'your-company-id',
      apiKey: 'your-api-key'
    };

    // Initialize nullRecorder on component mount
    nullRecorder(config);
    nullRecorder.init();

    // Optional cleanup if needed on component unmount
    return () => {
      // Cleanup logic here
    };
  }, []);

  return (
    <div>
      <h1>Welcome to Our Application</h1>
      {/* Your application components go here */}
    </div>
  );
};

export default App;
```

## Example NextJs

```bash
// pages/_app.js
import { useEffect } from 'react';
import { nullRecorder } from 'nullfreak-recorder';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== "undefined") { // Ensures the code runs only in the browser
      const config = {
        companyId: 'your-company-id',
        apiKey: 'your-api-key',
        // Add any additional configuration needed
      };

      nullRecorder(config);
      nullRecorder.init();
    }
  }, []);

  return <Component {...pageProps} />
}

export default MyApp;
```
