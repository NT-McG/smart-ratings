# Smart Ratings: A AU-NZ Longsword – Probabilistic Strength & Seeding Model using HEMA Ratings Data

This dashboard transforms raw HEMA Ratings competition data into a probabilistic performance model designed to estimate *true competitive strength* beyond raw rating values.

## What the table shows

Each row represents a fencer ranked by **estimated skill strength**, not their published rating.

Key columns:

* **Rank**: Ordering by inferred skill (highest to lowest).
* **Tier**: Quantile-based grouping of athletes into 6 performance bands.
* **Athlete / Club**: Identity metadata from HEMA Ratings.
* **Rating**: Published rating value from the source system.
* **Skill**: Bayesian-adjusted estimate of true strength.
* **Uncertainty (σ)**: Model uncertainty in skill estimate.
* **Win %**: Expected win probability against the population mean.

Tier labels include subtle intra-tier grading (+ / blank / -), indicating relative position within each tier band.

---

## Methodology

The system combines **Glicko-style rating principles** with a lightweight Bayesian adjustment to account for confidence in each rating.

### 1. Bayesian Skill Adjustment

Each fencer’s observed rating is adjusted toward the population mean:

* Players with higher confidence retain more of their raw rating.
* Players with lower confidence regress more strongly toward the mean.

This produces a more stable estimate of true ability, reducing volatility from small sample sizes.

### 2. Uncertainty Model (σ)

Uncertainty is inversely related to confidence:

* High confidence → low σ (stable estimate)
* Low confidence → high σ (uncertain estimate)

### 3. Win Probability

Win probability is derived using a logistic-style comparison between a fencer’s skill and the population mean skill.

---

## Purpose

The goal is not only ranking fencers, but identifying:

* true underlying strength
* hidden performance clusters
* relative competitiveness within tiers
* likely match outcomes beyond raw rating comparison

This enables more informed seeding, matchup analysis, and identification of underrated or overperforming athletes within the AU/NZ competitive fencing ecosystem.
