# nullfreak

`nullfreak` is a JavaScript library designed to capture user interactions in web applications for analytics and monitoring purposes. It provides easy-to-use APIs to track user activities like clicks, inputs, and scrolls, and sends them to a specified endpoint for storage and analysis.

## Features

- **Event Tracking**: Tracks various user interactions on a webpage.
- **Batch Processing**: Sends events in batches to reduce network overhead.
- **Customizable**: Allows customization of tracked events and elements.

## Installation

Install `nullfreak-recorder` using npm:

```bash
npm install nullfreak-recorder
```

## Example ReactJS

```bash
import React, { useEffect } from 'react';
import { nullRecorder } from 'nullfreak-recorder';

const App = () => {
  useEffect(() => {

    // Initialize nullRecorder on component mount
    nullRecorder({
      companyId: "",
      apiKey: ""
    });

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
import { useNullRecorder } from 'nullfreak-recorder';

function MyApp({ Component, pageProps }) {
  useNullRecorder({
    companyId: "",
    apiKey: "",
  })

  return <Component {...pageProps} />
}

export default MyApp;
```
