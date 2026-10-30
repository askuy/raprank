export const SITE = {
  name: 'RapRank',
  url: 'https://raprank.org',
  tagline: 'The AI Rap & Music Video Tools Directory',
  description:
    'RapRank ranks the best AI rap video generators, AI music video makers, rap song generators, rapper voices and lyric tools — with free tiers and pricing compared.',
  submitUrl: 'mailto:submit@raprank.org?subject=Submit%20a%20tool%20to%20RapRank',
  updated: '2026-10',
};

export const FREE_TOOLS = [
  {
    href: '/rap-lyrics-generator',
    name: 'Rap Lyrics Generator',
    blurb: 'Generate rhyming 16-bar verses or full rap songs in trap, drill, boom bap or motivational style. Rhymes are color-coded.',
  },
  {
    href: '/rap-name-generator',
    name: 'Rap Name Generator',
    blurb: 'Get 20 rapper names in one click, in styles like trap, drill, old school and Lil/Young. Free, no sign-up.',
  },
];

// Listing tiers shown on /submit. Change the sponsor price here.
export const LISTING = {
  sponsorPrice: '$49/month',
  contact: 'submit@raprank.org',
  repo: 'https://github.com/askuy/raprank',
  // GitHub issue form (.github/ISSUE_TEMPLATE/submit-tool.yml); approved issues become listings automatically.
  submitUrl: 'https://github.com/askuy/raprank/issues/new?template=submit-tool.yml',
};
