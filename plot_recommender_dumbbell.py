from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


def pretty_model_name(model_name: str) -> str:
    return {
        "tfidf-v1": "TF-IDF",
        "sbert-v1": "SBERT",
    }.get(model_name, model_name)


def anonymize_users(usernames: list[str]) -> dict[str, str]:
    """
    Vytvorí anonymizované označenia používateľov U1, U2, ...
    podľa poradia v grafe.
    """
    return {username: f"U{i + 1}" for i, username in enumerate(usernames)}


def build_dumbbell_plot(
    df: pd.DataFrame,
    metric: str,
    title: str,
    output_path: Path,
):
    required_columns = {"username", "model", metric}
    missing_columns = required_columns - set(df.columns)

    if missing_columns:
        raise ValueError(
            f"Missing columns in per-user CSV: {sorted(missing_columns)}"
        )

    pretty = df.copy()
    pretty["model"] = pretty["model"].apply(pretty_model_name)

    pivot = pretty.pivot(index="username", columns="model", values=metric)

    if "TF-IDF" not in pivot.columns or "SBERT" not in pivot.columns:
        raise ValueError("CSV must contain both models: tfidf-v1 and sbert-v1.")

    pivot["mean"] = pivot[["TF-IDF", "SBERT"]].mean(axis=1)
    pivot = pivot.sort_values("mean", ascending=True).drop(columns=["mean"])

    user_map = anonymize_users(list(pivot.index))
    pivot = pivot.rename(index=user_map)

    users = list(pivot.index)
    y_positions = list(range(len(users)))

    tfidf_values = pivot["TF-IDF"].values
    sbert_values = pivot["SBERT"].values

    fig, ax = plt.subplots(figsize=(10, 6.5))

    for y, tfidf, sbert in zip(y_positions, tfidf_values, sbert_values):
        ax.plot(
            [tfidf, sbert],
            [y, y],
            linewidth=2,
            alpha=0.55,
        )

    ax.scatter(
        tfidf_values,
        y_positions,
        s=95,
        label="TF-IDF",
        zorder=3,
    )

    ax.scatter(
        sbert_values,
        y_positions,
        s=95,
        marker="D",
        label="SBERT",
        zorder=3,
    )

    for y, value in zip(y_positions, tfidf_values):
        ax.text(
            value - 0.015,
            y,
            f"{value:.3f}",
            va="center",
            ha="right",
            fontsize=8,
        )

    for y, value in zip(y_positions, sbert_values):
        ax.text(
            value + 0.015,
            y,
            f"{value:.3f}",
            va="center",
            ha="left",
            fontsize=8,
        )

    ax.set_title(title, fontsize=16, pad=16)
    ax.set_xlabel(metric, fontsize=12)
    ax.set_ylabel("Používateľ", fontsize=12)

    ax.set_yticks(y_positions)
    ax.set_yticklabels(users)

    max_value = max(float(tfidf_values.max()), float(sbert_values.max()))
    ax.set_xlim(0, min(1.05, max_value + 0.18))

    ax.grid(axis="x", alpha=0.25)
    ax.legend(title="Model", loc="lower right")

    # pomocný text
    ax.text(
        0.01,
        0.98,
        "Čiara znázorňuje rozdiel medzi modelmi pri rovnakom používateľovi.",
        transform=ax.transAxes,
        ha="left",
        va="top",
        fontsize=9,
        bbox=dict(
            boxstyle="round,pad=0.35",
            facecolor="white",
            edgecolor="0.75",
            alpha=0.9,
        ),
    )

    plt.tight_layout()
    plt.savefig(output_path, dpi=220, bbox_inches="tight")
    plt.close()


def main():
    base = Path("evaluation_outputs")
    plots_dir = base / "plots"
    plots_dir.mkdir(parents=True, exist_ok=True)

    per_user_csv = base / "recommender_eval_per_user.csv"

    if not per_user_csv.exists():
        raise FileNotFoundError(f"Missing file: {per_user_csv}")

    per_user_df = pd.read_csv(per_user_csv)

    metrics = [
        (
            "precision@5",
            "Porovnanie modelov podľa používateľov (Precision@5)",
            "dumbbell_precision_at_5.png",
        ),
        (
            "recall@5",
            "Porovnanie modelov podľa používateľov (Recall@5)",
            "dumbbell_recall_at_5.png",
        ),
        (
            "map@5",
            "Porovnanie modelov podľa používateľov (MAP@5)",
            "dumbbell_map_at_5.png",
        ),
        (
            "ndcg@5",
            "Porovnanie modelov podľa používateľov (nDCG@5)",
            "dumbbell_ndcg_at_5.png",
        ),
        (
            "precision@10",
            "Porovnanie modelov podľa používateľov (Precision@10)",
            "dumbbell_precision_at_10.png",
        ),
        (
            "recall@10",
            "Porovnanie modelov podľa používateľov (Recall@10)",
            "dumbbell_recall_at_10.png",
        ),
        (
            "map@10",
            "Porovnanie modelov podľa používateľov (MAP@10)",
            "dumbbell_map_at_10.png",
        ),
        (
            "ndcg@10",
            "Porovnanie modelov podľa používateľov (nDCG@10)",
            "dumbbell_ndcg_at_10.png",
        ),
    ]

    for metric, title, filename in metrics:
        build_dumbbell_plot(
            df=per_user_df,
            metric=metric,
            title=title,
            output_path=plots_dir / filename,
        )

    print(f"Done. Dumbbell plots saved into: {plots_dir.resolve()}")


if __name__ == "__main__":
    main()