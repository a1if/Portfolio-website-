# Portfolio Website

A responsive, accessible portfolio website for Alex Morgan, a machine learning engineer and applied scientist. The site highlights AI-focused experience, projects, skills, testimonials, and includes a contact form.

## Preview

Run the local backend to explore the full experience (including the contact form API).

```bash
npm start
```

Then open [http://localhost:5000](http://localhost:5000) in your browser.

## Features

- Modern hero section with clear calls-to-action
- Responsive navigation with mobile menu and sticky header
- Dark and light theme toggle persisted between visits
- Animated scroll reveal interactions and testimonial slider
- Accessible semantic markup with keyboard-friendly controls
- Node.js backend that stores contact inquiries in `server/data/contacts.json`
- Dedicated case study pages for each featured project with deeper context

## Customization

Update the content in `index.html` to reflect your personal details, projects, and testimonials. Tweak colors, typography, and layout within `styles.css`. Additional interactivity can be added in `script.js`. Case study copy lives in `projects/*.html` if you want to swap in your own success stories.

## Local development

1. Install [Node.js 18+](https://nodejs.org/).
2. From the project root, run:

   ```bash
   npm start
   ```

   The server serves the static site and exposes REST endpoints at `/api/*`.

3. Contact submissions are written to `server/data/contacts.json` (created automatically on first run and ignored by Git). Check this file to review incoming messages.

## Deploying to GitHub Pages

The repository includes a GitHub Actions workflow that ships the front-end to GitHub Pages whenever you push to `main`. Because GitHub Pages only serves static assets, the contact form gracefully explains that submissions are disabled on that environment. To keep the backend available, host the `server` directory separately (Render, Railway, Fly.io, etc.) and update the form action URL.

1. Commit the `.github/workflows/deploy.yml` file and push the repository to GitHub.
2. Open your repository on GitHub and head to **Settings → Pages**.
3. Under **Build and deployment**, select **GitHub Actions** as the source. The "Deploy to GitHub Pages" workflow appears automatically after the first push.
4. Push to `main` or trigger the workflow manually from the **Actions** tab. The workflow installs dependencies, runs tests, and uploads the static `dist` bundle.
5. When the workflow finishes, the live URL is shown on the run summary and within **Settings → Pages**.

## API endpoints

- `POST /api/contact` &mdash; Accepts `{ name, email, message }` and stores the submission.
- `GET /api/health` &mdash; Simple heartbeat endpoint returning uptime metadata.

## License

MIT
