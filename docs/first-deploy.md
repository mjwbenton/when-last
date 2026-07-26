# First deploy — bootstrapping When Last

This doc walks through the one-time setup to stand When Last up from scratch.
Once it's done, ongoing deploys are just `git push` to `main` and GitHub
Actions takes it from there (`.github/workflows/deploy.yml`).

## Account layout

When Last spans two AWS accounts (see `packages/infra/src/providers.ts`):

| Account        | Role                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------ |
| `858777967843` | Parent. Owns `mattb.tech` hosted zone `Z2GPSB1CDK86DH` and the `github-actions-admin` OIDC role. |
| `027053845179` | Deploy. All app infra (buckets, CloudFront, Lambda, sub-zone) lives here.                        |

## Prerequisites

Repo secret `PULUMI_CONFIG_PASSPHRASE` set in GitHub. Pulumi encrypts stack outputs
and config secrets with this; any random high-entropy value works, but
**save it** — losing it orphans the state.

## Bootstrap steps

### 1. Log in to the Pulumi backend

```sh
cd packages/infra
export PULUMI_CONFIG_PASSPHRASE='<same value you put in the GitHub secret>'
AWS_PROFILE=<your-admin-profile> pulumi login s3://whenlast.mattb.tech-infra-state
```

The `s3://whenlast.mattb.tech-infra-state` bucket must exist first — create it (in the deploy
account, `027053845179`) before logging in if it doesn't already.

### 2. Initialize the `prod` stack

From `packages/infra`:

```sh
AWS_PROFILE=<your-admin-profile> pulumi stack init prod
```

This will populate `Pulumi.prod.yaml` with an `encryptionsalt` line — commit that.

### 3. Push to `main`

Trigger CI by pushing to `main`. The `deploy` job needs AWS credentials via the
`github-actions-admin` OIDC role in the parent account — make sure that role's trust
policy allows this repo (see `mjwbenton/aws-account-stack` if that's where it's managed).
