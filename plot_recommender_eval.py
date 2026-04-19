from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


def add_bar_labels(ax):
    for container in ax.containers:
        ax.bar_label(container, fmt="%.4f", padding=3, fontsize=10)


def build_grouped_plot(df: pd.DataFrame, metrics: list[str], title: str, output_path: Path):
    plot_df = df.set_index("model")[metrics].T

    ax = plot_df.plot(kind="bar", figsize=(12, 7))
    ax.set_title(title, fontsize=18, pad=16)
    ax.set_xlabel("Metric", fontsize=12)
    ax.set_ylabel("Score", fontsize=12)
    ax.set_ylim(0, max(plot_df.max()) + 0.08)
    ax.tick_params(axis="x", rotation=0)
    ax.legend(title="Model")
    add_bar_labels(ax)

    plt.tight_layout()
    plt.savefig(output_path, dpi=220, bbox_inches="tight")
    plt.close()


def build_difference_plot(df: pd.DataFrame, output_path: Path):
    tfidf = df[df["model"] == "tfidf-v1"].iloc[0]
    sbert = df[df["model"] == "sbert-v1"].iloc[0]

    metrics = [
        "precision@5",
        "recall@5",
        "map@5",
        "ndcg@5",
        "precision@10",
        "recall@10",
        "map@10",
        "ndcg@10",
    ]

    delta = pd.Series({metric: sbert[metric] - tfidf[metric] for metric in metrics})

    ax = delta.plot(kind="bar", figsize=(13, 7))
    ax.set_title("Difference by metric (SBERT - TF-IDF)", fontsize=18, pad=16)
    ax.set_xlabel("Metric", fontsize=12)
    ax.set_ylabel("Difference (positive = SBERT better, negative = TF-IDF better)", fontsize=12)
    ax.axhline(0, linewidth=1)
    ax.tick_params(axis="x", rotation=35)

    for container in ax.containers:
        ax.bar_label(container, fmt="%.4f", padding=3, fontsize=10)

    ax.text(
        0.99, 0.98,
        "Above 0: SBERT performs better\nBelow 0: TF-IDF performs better",
        transform=ax.transAxes,
        ha="right",
        va="top",
        fontsize=10,
        bbox=dict(boxstyle="round,pad=0.3", facecolor="white", edgecolor="black", alpha=0.9),
    )

    plt.tight_layout()
    plt.savefig(output_path, dpi=220, bbox_inches="tight")
    plt.close()


def build_table_png(df: pd.DataFrame, output_path: Path):
    pretty = df.copy()
    pretty["model"] = pretty["model"].replace({
        "tfidf-v1": "TF-IDF",
        "sbert-v1": "SBERT",
    })

    rename_map = {
        "model": "Model",
        "precision@5": "Precision@5",
        "recall@5": "Recall@5",
        "map@5": "MAP@5",
        "ndcg@5": "nDCG@5",
        "precision@10": "Precision@10",
        "recall@10": "Recall@10",
        "map@10": "MAP@10",
        "ndcg@10": "nDCG@10",
    }
    pretty = pretty.rename(columns=rename_map)

    for col in pretty.columns[1:]:
        pretty[col] = pretty[col].map(lambda x: f"{x:.4f}")

    fig, ax = plt.subplots(figsize=(14, 2.8))
    ax.axis("off")

    table = ax.table(
        cellText=pretty.values,
        colLabels=pretty.columns,
        cellLoc="center",
        loc="center",
    )
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    table.scale(1, 1.8)

    ax.set_title("Summary of recommender evaluation results", fontsize=16, pad=14)

    plt.tight_layout()
    plt.savefig(output_path, dpi=220, bbox_inches="tight")
    plt.close()


def main():
    base = Path("evaluation_outputs")
    summary_csv = base / "recommender_eval_summary.csv"

    if not summary_csv.exists():
        raise FileNotFoundError(f"Missing file: {summary_csv}")

    df = pd.read_csv(summary_csv)

    plots_dir = base / "plots"
    plots_dir.mkdir(parents=True, exist_ok=True)

    build_grouped_plot(
        df=df,
        metrics=["precision@5", "recall@5", "map@5", "ndcg@5"],
        title="Recommender evaluation comparison (@5)",
        output_path=plots_dir / "combined_at_5.png",
    )

    build_grouped_plot(
        df=df,
        metrics=["precision@10", "recall@10", "map@10", "ndcg@10"],
        title="Recommender evaluation comparison (@10)",
        output_path=plots_dir / "combined_at_10.png",
    )

    build_difference_plot(
        df=df,
        output_path=plots_dir / "metric_differences.png",
    )

    build_table_png(
        df=df,
        output_path=plots_dir / "results_table.png",
    )

    print(f"Plots saved to: {plots_dir}")


if __name__ == "__main__":
    main()