# Supported Git hosts

`<git-log>` and `<git-show>` load public repositories directly from GitHub, GitLab.com, and
Bitbucket Cloud. They do not authenticate requests, so private repositories and self-hosted Git
services are not supported. `<git-diff>` does not contact a Git host; it renders patch text supplied
by the page.

## Repository URLs

| Host            | `repository` URL format                                      |
| --------------- | ------------------------------------------------------------ |
| GitHub          | `https://github.com/owner/repo`                              |
| GitLab.com      | `https://gitlab.com/group/project` (including nested groups) |
| Bitbucket Cloud | `https://bitbucket.org/workspace/repo`                       |

## Requests and rate limits

A single-revision `<git-log>` normally makes one API request. Revision comparisons can need more:
symmetric ranges query both sides, and large GitHub comparisons can require additional pages.
`<git-show>` requests commit metadata and its diff separately. GitLab commit diffs can require
multiple pages. [Repository caching](/guides/repository-caching) explains when repeated elements
share requests and reuse stored results.

The hosts currently publish these limits for unauthenticated requests from one IP address:

| Host            | Published limit  | Host documentation                                                                                      |
| --------------- | ---------------- | ------------------------------------------------------------------------------------------------------- |
| GitHub          | 60 requests/hour | [REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) |
| GitLab.com      | 60 requests/hour | [GitLab.com rate limits](https://docs.gitlab.com/user/gitlab_com/rate_limits/)                          |
| Bitbucket Cloud | 60 requests/hour | [API request limits](https://support.atlassian.com/bitbucket-cloud/docs/api-request-limits/)            |

These are the published general limits. Hosts can also apply endpoint or burst limits, and their
rules can change. Check the linked documentation for current details.

## Large diffs

`<git-show>` and its change summaries use the patch returned by the host. If a host omits part of a
large diff, the rendered patch and counts cover only the returned content.

- [GitHub documents limits for commit diffs](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits#diff-limits), including per-file and total file limits.
- [GitLab's commit diff API](https://docs.gitlab.com/api/commits/#retrieve-commit-diff) stops returning files beyond its configured limit and can mark file diffs as collapsed or too large. [GitLab.com publishes its diff display limits](https://docs.gitlab.com/user/gitlab_com/#diff-display-limits).

For Bitbucket Cloud, see [its commit and diff API reference](https://developer.atlassian.com/cloud/bitbucket/rest/api-group-commits/) for the current endpoint behavior.
