import os
from github import Github
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME")


def get_github_client():
    """Connect to GitHub API"""
    try:
        g = Github(GITHUB_TOKEN)
        return g
    except Exception as e:
        print(f"GitHub connection error: {e}")
        return None


def get_user_repos():
    """Get all repositories of the user"""
    try:
        g = get_github_client()
        if not g:
            return []

        user = g.get_user(GITHUB_USERNAME)
        repos = []

        for repo in user.get_repos():
            repos.append({
                "id": repo.id,
                "name": repo.name,
                "full_name": repo.full_name,
                "description": repo.description or "",
                "url": repo.html_url,
                "updated_at": str(repo.updated_at)
            })

        return repos

    except Exception as e:
        print(f"Error getting repos: {e}")
        return []


def get_repo_commits(repo_name: str, days: int = 30):
    """Get commits from a repository in last N days"""
    try:
        g = get_github_client()
        if not g:
            return []

        repo = g.get_repo(f"{GITHUB_USERNAME}/{repo_name}")

        # Get commits from last N days
        since_date = datetime.now() - timedelta(days=days)

        commits = []
        for commit in repo.get_commits(since=since_date):
            commits.append({
                "sha": commit.sha[:7],
                "message": commit.commit.message.split("\n")[0],
                "author": commit.commit.author.name,
                "date": str(commit.commit.author.date),
                "url": commit.html_url,
                "files_changed": commit.stats.total
                    if commit.stats else 0
            })

            # Limit to 50 commits
            if len(commits) >= 50:
                break

        return commits

    except Exception as e:
        print(f"Error getting commits: {e}")
        return []


def get_developer_commits(
    repo_name: str,
    developer_name: str,
    days: int = 7
):
    """Get commits by a specific developer"""
    try:
        all_commits = get_repo_commits(repo_name, days)

        developer_commits = [
            c for c in all_commits
            if developer_name.lower() in c["author"].lower()
        ]

        return developer_commits

    except Exception as e:
        print(f"Error getting developer commits: {e}")
        return []


def calculate_commit_score(commits: list) -> dict:
    """
    Calculate AI Progress Score based on commits
    Score is based on:
    - Number of commits (40%)
    - Recency of commits (40%)
    - Files changed (20%)
    """
    if not commits:
        return {
            "score": 0,
            "commit_count": 0,
            "last_commit": None,
            "total_files": 0,
            "breakdown": {
                "commit_score": 0,
                "recency_score": 0,
                "files_score": 0
            }
        }

    commit_count = len(commits)
    total_files = sum(c["files_changed"] for c in commits)

    # Commit count score (max 40 points)
    # 10+ commits = full score
    commit_score = min(commit_count / 10 * 40, 40)

    # Recency score (max 40 points)
    # Commit today = 40, 7 days ago = 0
    try:
        last_commit_date = datetime.strptime(
            commits[0]["date"][:10], "%Y-%m-%d"
        )
        days_since = (datetime.now() - last_commit_date).days
        recency_score = max(0, 40 - (days_since * 6))
    except:
        recency_score = 0

    # Files changed score (max 20 points)
    # 50+ files = full score
    files_score = min(total_files / 50 * 20, 20)

    total_score = int(commit_score + recency_score + files_score)
    total_score = min(total_score, 100)

    return {
        "score": total_score,
        "commit_count": commit_count,
        "last_commit": commits[0]["date"][:10]
            if commits else None,
        "total_files": total_files,
        "breakdown": {
            "commit_score": round(commit_score),
            "recency_score": round(recency_score),
            "files_score": round(files_score)
        }
    }