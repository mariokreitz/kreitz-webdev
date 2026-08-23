export interface GithubRepoApiResponse {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  topics: string[];
  private: boolean;
  updated_at: string;
  owner: {
    id: number;
    login: string;
  };
}
