from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


# -----------------------------
# Helpers
# -----------------------------
def pretty_model_name(model_name: str) -> str:
    return {
        "tfidf-v1": "TF-IDF",
        "sbert-v1": "SBERT",
    }.get(model_name, model_name)


def ensure_plots_dir(base: Path) -> Path:
    plots_dir = base / "plots"
    plots_dir.mkdir(parents=True, exist_ok=True)
    return plots_dir


# -----------------------------
# Aggregate summary plots
# -----------------------------
def build_grouped_metric_chart(
    df: pd.DataFrame,
    k_suffix: str,
    title: str,
    output_path: Path,
):
    metric_columns = [
        f"precision@{k_suffix}",
        f"recall@{k_suffix}",
        f"map@{k_suffix}",
        f"ndcg@{k_suffix}",
    ]

    pretty = df.copy()
    pretty["model"] = pretty["model"].apply(pretty_model_name)

    plot_df = pretty.set_index("model")[metric_columns].T

    ax = plot_df.plot(kind="bar", figsize=(10, 6))
    ax.set_title(title, fontsize=16, pad=16)
    ax.set_xlabel("Metric", fontsize=12)
    ax.set_ylabel("Value", fontsize=12)
    ax.set_ylim(0, 1.05)
    ax.legend(title="Model")
    ax.grid(axis="y", alpha=0.25)

    for container in ax.containers:
        ax.bar_label(container, fmt="%.3f", padding=3, fontsize=8)

    plt.tight_layout()
    plt.savefig(output_path, dpi=220, bbox_inches="tight")
    plt.close()


def build_metric_difference_chart(
    df: pd.DataFrame,
    title: str,
    output_path: Path,
):
    pivot = df.set_index("model")
    tfidf = pivot.loc["tfidf-v1"]
    sbert = pivot.loc["sbert-v1"]

    metrics = [
        "precision@5", "recall@5", "map@5", "ndcg@5",
        "precision@10", "recall@10", "map@10", "ndcg@10",
    ]

    differences = [sbert[m] - tfidf[m] for m in metrics]

    fig, ax = plt.subplots(figsize=(11, 6))
    ax.bar(metrics, differences)

    ax.axhline(0, linewidth=1)
    ax.set_title(title, fontsize=16, pad=16)
    ax.set_xlabel("Metric", fontsize=12)
    ax.set_ylabel("Difference (SBERT - TF-IDF)", fontsize=12)
    ax.tick_params(axis="x", rotation=30)
    ax.grid(axis="y", alpha=0.25)

    for i, value in enumerate(differences):
        ax.text(
            i,
            value + (0.005 if value >= 0 else -0.005),
            f"{value:.3f}",
            ha="center",
            va="bottom" if value >= 0 else "top",
            fontsize=8,
        )

    plt.tight_layout()
    plt.savefig(output_path, dpi=220, bbox_inches="tight")
    plt.close()


def build_table_png(df: pd.DataFrame, output_path: Path):
    pretty = df.copy()
    pretty["model"] = pretty["model"].apply(pretty_model_name)

    for col in pretty.columns:
        if col != "model":
            pretty[col] = pretty[col].apply(
                lambda x: f"{x:.4f}" if isinstance(x, (int, float)) else x
            )

    fig, ax = plt.subplots(figsize=(12, 2.5))
    ax.axis("off")

    table = ax.table(
        cellText=pretty.values,
        colLabels=pretty.columns,
        cellLoc="center",
        loc="center",
    )
    table.auto_set_font_size(False)
    table.set_fontsize(9)
    table.scale(1, 1.5)

    ax.set_title("Summary recommender evaluation results", fontsize=14, pad=12)

    plt.tight_layout()
    plt.savefig(output_path, dpi=220, bbox_inches="tight")
    plt.close()


# -----------------------------
# Per-user bar plots
# -----------------------------
def build_per_user_metric_plot(
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

    pivot["mean"] = pivot.mean(axis=1)
    pivot = pivot.sort_values("mean", ascending=False).drop(columns=["mean"])

    ax = pivot.plot(kind="bar", figsize=(14, 7))
    ax.set_title(title, fontsize=16, pad=16)
    ax.set_xlabel("User", fontsize=12)
    ax.set_ylabel(metric, fontsize=12)

    max_value = float(pivot.max().max()) if not pivot.empty else 1.0
    ax.set_ylim(0, min(1.05, max_value + 0.15))

    ax.tick_params(axis="x", rotation=35)
    ax.legend(title="Model")
    ax.grid(axis="y", alpha=0.25)

    mean_value = float(pivot.stack().mean())
    ax.axhline(mean_value, linestyle="--", linewidth=1)
    ax.text(
        0.99,
        mean_value + 0.01,
        f"Overall mean: {mean_value:.4f}",
        transform=ax.get_yaxis_transform(),
        ha="right",
        va="bottom",
        fontsize=10,
    )

    for container in ax.containers:
        ax.bar_label(container, fmt="%.3f", padding=3, fontsize=8)

    plt.tight_layout()
    plt.savefig(output_path, dpi=220, bbox_inches="tight")
    plt.close()


# -----------------------------
# Per-user variability boxplots
# -----------------------------
def build_user_variability_boxplot(
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

    models = ["TF-IDF", "SBERT"]
    data = [
        pretty[pretty["model"] == model][metric].dropna()
        for model in models
    ]

    fig, ax = plt.subplots(figsize=(9, 6))
    ax.boxplot(data, labels=models, showmeans=True)

    ax.set_title(title, fontsize=16, pad=16)
    ax.set_xlabel("Model", fontsize=12)
    ax.set_ylabel(metric, fontsize=12)
    ax.set_ylim(0, 1.05)
    ax.grid(axis="y", alpha=0.25)

    for i, values in enumerate(data, start=1):
        x_positions = [i] * len(values)
        ax.scatter(x_positions, values, alpha=0.75)

    plt.tight_layout()
    plt.savefig(output_path, dpi=220, bbox_inches="tight")
    plt.close()


# -----------------------------
# Main
# -----------------------------
def main():
    base = Path("evaluation_outputs")
    plots_dir = ensure_plots_dir(base)

    summary_csv = base / "recommender_eval_summary.csv"
    per_user_csv = base / "recommender_eval_per_user.csv"

    if not summary_csv.exists():
        raise FileNotFoundError(f"Missing file: {summary_csv}")

    summary_df = pd.read_csv(summary_csv)

    build_grouped_metric_chart(
        df=summary_df,
        k_suffix="5",
        title="Recommender evaluation summary (@5)",
        output_path=plots_dir / "combined_at_5.png",
    )

    build_grouped_metric_chart(
        df=summary_df,
        k_suffix="10",
        title="Recommender evaluation summary (@10)",
        output_path=plots_dir / "combined_at_10.png",
    )

    build_metric_difference_chart(
        df=summary_df,
        title="Metric differences between models",
        output_path=plots_dir / "metric_differences.png",
    )

    build_table_png(
        df=summary_df,
        output_path=plots_dir / "results_table.png",
    )

    if per_user_csv.exists():
        per_user_df = pd.read_csv(per_user_csv)

        metrics = [
            ("precision@5", "Per-user recommender evaluation (Precision@5)", "per_user_precision_at_5.png", "boxplot_precision_at_5.png"),
            ("recall@5", "Per-user recommender evaluation (Recall@5)", "per_user_recall_at_5.png", "boxplot_recall_at_5.png"),
            ("map@5", "Per-user recommender evaluation (MAP@5)", "per_user_map_at_5.png", "boxplot_map_at_5.png"),
            ("ndcg@5", "Per-user recommender evaluation (nDCG@5)", "per_user_ndcg_at_5.png", "boxplot_ndcg_at_5.png"),
            ("precision@10", "Per-user recommender evaluation (Precision@10)", "per_user_precision_at_10.png", "boxplot_precision_at_10.png"),
            ("recall@10", "Per-user recommender evaluation (Recall@10)", "per_user_recall_at_10.png", "boxplot_recall_at_10.png"),
            ("map@10", "Per-user recommender evaluation (MAP@10)", "per_user_map_at_10.png", "boxplot_map_at_10.png"),
            ("ndcg@10", "Per-user recommender evaluation (nDCG@10)", "per_user_ndcg_at_10.png", "boxplot_ndcg_at_10.png"),
        ]

        for metric, title, bar_filename, box_filename in metrics:
            build_per_user_metric_plot(
                df=per_user_df,
                metric=metric,
                title=title,
                output_path=plots_dir / bar_filename,
            )

            build_user_variability_boxplot(
                df=per_user_df,
                metric=metric,
                title=f"Variability of results between users ({metric})",
                output_path=plots_dir / box_filename,
            )
    else:
        print(f"Skipped per-user plots and boxplots because file does not exist: {per_user_csv}")

    print(f"Done. All plots saved into: {plots_dir.resolve()}")


if __name__ == "__main__":
    main()