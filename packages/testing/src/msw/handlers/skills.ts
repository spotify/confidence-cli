import { http, HttpResponse } from 'msw';

export const skillsHandlers = [
  http.get(
    'https://raw.githubusercontent.com/spotify/confidence-ai-plugins/main/skills/:skill/SKILL.md',
    (info) => {
      return HttpResponse.text(`# ${info.params['skill']}\nTest skill content`);
    },
  ),
];
