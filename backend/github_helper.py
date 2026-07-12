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
def get_pull_requests(
    repo_name: str,
    state: str = "all"
) -> list:
    """
    Get pull requests from repository
    state = open, closed, or all
    """
    try:
        g = get_github_client()
        if not g:
            return []

        repo = g.get_repo(
            f"{GITHUB_USERNAME}/{repo_name}"
        )

        prs = []
        for pr in repo.get_pulls(
            state=state,
            sort="updated",
            direction="desc"
        ):
            # Get review status
            reviews = list(pr.get_reviews())
            approved = any(
                r.state == "APPROVED"
                for r in reviews
            )
            changes_requested = any(
                r.state == "CHANGES_REQUESTED"
                for r in reviews
            )

            if approved:
                review_status = "approved"
            elif changes_requested:
                review_status = "changes_requested"
            elif reviews:
                review_status = "reviewed"
            else:
                review_status = "pending_review"

            prs.append({
                "number": pr.number,
                "title": pr.title,
                "author": pr.user.login,
                "state": pr.state,
                "review_status": review_status,
                "created_at": str(pr.created_at),
                "updated_at": str(pr.updated_at),
                "merged": pr.merged,
                "merged_at": str(pr.merged_at)
                    if pr.merged_at else None,
                "additions": pr.additions,
                "deletions": pr.deletions,
                "changed_files": pr.changed_files,
                "comments": pr.comments,
                "review_comments": pr.review_comments,
                "url": pr.html_url,
                "body": pr.body or ""
            })

            # Limit to 20 PRs
            if len(prs) >= 20:
                break

        return prs

    except Exception as e:
        print(f"Error getting PRs: {e}")
        return []


def analyze_pr_quality(pr: dict) -> dict:
    """
    Use AI logic to analyze PR quality
    Returns a quality score and feedback
    """
    score = 0
    feedback = []

    # Check title quality
    if len(pr["title"]) > 10:
        score += 20
        feedback.append("✅ Good PR title")
    else:
        feedback.append("❌ PR title too short")

    # Check description
    if len(pr["body"]) > 50:
        score += 20
        feedback.append("✅ Good PR description")
    else:
        feedback.append("⚠️ Add more description")

    # Check size (smaller PRs are better)
    total_changes = pr["additions"] + pr["deletions"]
    if total_changes < 100:
        score += 25
        feedback.append("✅ Small focused PR")
    elif total_changes < 300:
        score += 15
        feedback.append("⚠️ Medium sized PR")
    else:
        score += 5
        feedback.append("❌ Large PR — consider splitting")

    # Check review status
    if pr["review_status"] == "approved":
        score += 25
        feedback.append("✅ PR approved by reviewer")
    elif pr["review_status"] == "reviewed":
        score += 15
        feedback.append("⚠️ PR reviewed but not approved")
    else:
        score += 0
        feedback.append("❌ PR not reviewed yet")

    # Check if merged
    if pr["merged"]:
        score += 10
        feedback.append("✅ PR successfully merged")

    return {
        "quality_score": min(score, 100),
        "feedback": feedback,
        "recommendation": (
            "Excellent PR 🟢" if score >= 70
            else "Good PR 🟡" if score >= 40
            else "Needs Improvement 🔴"
        )
    }


def get_pr_statistics(repo_name: str) -> dict:
    """Get overall PR statistics for repository"""
    try:
        prs = get_pull_requests(repo_name, "all")

        if not prs:
            return {
                "total": 0,
                "open": 0,
                "merged": 0,
                "closed": 0,
                "avg_changes": 0,
                "merge_rate": 0
            }

        total = len(prs)
        open_prs = len([p for p in prs
                        if p["state"] == "open"])
        merged = len([p for p in prs if p["merged"]])
        closed = len([p for p in prs
                      if p["state"] == "closed"
                      and not p["merged"]])

        avg_changes = sum(
            p["additions"] + p["deletions"]
            for p in prs
        ) / total if total > 0 else 0

        merge_rate = (merged / total * 100) \
            if total > 0 else 0

        return {
            "total": total,
            "open": open_prs,
            "merged": merged,
            "closed": closed,
            "avg_changes": round(avg_changes),
            "merge_rate": round(merge_rate)
        }

    except Exception as e:
        print(f"PR stats error: {e}")
        return {}  