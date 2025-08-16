# Intelagent Chatbot UI

This is a simple static frontend to test the Intelagent chatbot widget.

- The widget is configured to talk to the production webhook:
  `https://intelagentchatbotn8n.up.railway.app/webhook/chatbot`
- To launch the widget, open `/chatbot_widget.html` in the browser.

## Deployment

Push to Railway using a public/ folder structure:

```
public/
├── index.html
└── chatbot_widget.html
```

Set the output directory to `public` when deploying as a static site.
