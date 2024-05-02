# adminima

An app for simple definition of administrative processes and change requests. Build around concepts of tasks, and the roles who are **accountable** for their outcomes, **responsible** for executing them, **consulted** on how they should be done, and **informed** that they are happening or completed (ARCI). People are attached to roles.

The technology stack is:

- [SvelteKit](https://kit.svelte.dev) for front-end and interfacing with serverless infrastructure
- [Vercel](https://vercel.com) for scalable hosting of the app and managed deployments
- [Supabase](https://supabase.com) for database, file storage, and passwordless authentication
- [Resend](https://resend.com) for emails

At the moment, the project is not intended as a profit-making venture, but rather free infrastructure for not-for-profit organizations.

Amy maintains this. [Write her](mailto:ajko@uw.edu) if you'd like to learn more about her plans.

## Setup

To run locally,

- [ ] Clone this repository
- [ ] `npm install` inside the repository directory
- [ ] Install [Docker](https://docs.docker.com/desktop/install/mac-install/) for local development, and start it
- [ ] Run `npm run dev` to start the local vite dev server
- [ ] Run `npm run emu` to start local Supabase docker image
