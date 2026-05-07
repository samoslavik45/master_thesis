from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


def add_bar_labels(ax):
    for container in ax.containers:
        ax.bar_label(container, fmt="%.4f", padding=3, fontsize=10)


def build_grouped_plot(
    df: pd.DataFrame,
    metrics: list[str],
    title: str,
    output_path: Path,
):
    pretty = df.copy()
    pretty["model"] = pretty["model"].replace({
        "tfidf-v1": "TF-IDF",
        "sbert-v1": "SBERT",
    })

    plot_df = pretty.set_index("model")[metrics].T

    ax = plot_df.plot(kind="bar", figsize=(12, 7))
    ax.set_title(title, fontsize=18, pad=16)
    ax.set_xlabel("Metrika", fontsize=12)
    ax.set_ylabel("Hodnota", fontsize=12)
    ax.set_ylim(0, max(plot_df.max()) + 0.08)
    ax.tick_params(axis="x", rotation=0)
    ax.legend(title="Model")
    ax.grid(axis="y", alpha=0.25)

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
    ax.set_title("Rozdiel výsledkov medzi modelmi podľa metrík", fontsize=18, pad=16)
    ax.set_xlabel("Metrika", fontsize=12)
    ax.set_ylabel(
        "Rozdiel (kladná hodnota = lepší SBERT, záporná hodnota = lepší TF-IDF)",
        fontsize=12,
    )
    ax.axhline(0, linewidth=1)
    ax.tick_params(axis="x", rotation=35)
    ax.grid(axis="y", alpha=0.25)

    for container in ax.containers:
        ax.bar_label(container, fmt="%.4f", padding=3, fontsize=10)

    ax.text(
        0.99,
        0.98,
        "Nad 0: lepší SBERT\nPod 0: lepší TF-IDF",
        transform=ax.transAxes,
        ha="right",
        va="top",
        fontsize=10,
        bbox=dict(
            boxstyle="round,pad=0.3",
            facecolor="white",
            edgecolor="black",
            alpha=0.9,
        ),
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
        "users": "Počet používateľov",
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

    for col in pretty.columns:
        if col not in ["Model", "Počet používateľov"]:
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

    ax.set_title("Súhrn výsledkov experimentálneho vyhodnotenia", fontsize=16, pad=14)

    plt.tight_layout()
    plt.savefig(output_path, dpi=220, bbox_inches="tight")
    plt.close()


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
            f"V per-user CSV chýbajú stĺpce: {sorted(missing_columns)}"
        )

    pretty = df.copy()
    pretty["model"] = pretty["model"].replace({
        "tfidf-v1": "TF-IDF",
        "sbert-v1": "SBERT",
    })

    pivot = pretty.pivot(index="username", columns="model", values=metric)

    expected_order = ["SBERT", "TF-IDF"]
    existing_columns = [col for col in expected_order if col in pivot.columns]

    if len(existing_columns) < 2:
        raise ValueError("V CSV musia byť oba modely: SBERT aj TF-IDF.")

    pivot = pivot[existing_columns]

    pivot["priemer"] = pivot.mean(axis=1)
    pivot = pivot.sort_values("priemer", ascending=False).drop(columns=["priemer"])

    ax = pivot.plot(kind="bar", figsize=(14, 7))

    ax.set_title(title, fontsize=17, pad=16)
    ax.set_xlabel("Používateľ", fontsize=12)
    ax.set_ylabel(metric, fontsize=12)

    max_value = float(pivot.max().max()) if not pivot.empty else 1.0
    ax.set_ylim(0, min(1.05, max_value + 0.15))

    ax.tick_params(axis="x", rotation=35)
    ax.legend(title="Model")
    ax.grid(axis="y", alpha=0.25)

    priemer_sbert = float(pivot["SBERT"].mean())
    priemer_tfidf = float(pivot["TF-IDF"].mean())

    ax.axhline(
        priemer_sbert,
        linestyle="--",
        linewidth=1.2,
        color="tab:blue",
        alpha=0.75,
    )

    ax.axhline(
        priemer_tfidf,
        linestyle="--",
        linewidth=1.2,
        color="tab:orange",
        alpha=0.75,
    )

    ax.text(
        0.99,
        priemer_sbert + 0.030,
        f"Priemer SBERT: {priemer_sbert:.4f}",
        transform=ax.get_yaxis_transform(),
        ha="right",
        va="bottom",
        fontsize=10,
        color="tab:blue",
    )

    ax.text(
        0.99,
        priemer_tfidf - 0.045,
        f"Priemer TF-IDF: {priemer_tfidf:.4f}",
        transform=ax.get_yaxis_transform(),
        ha="right",
        va="top",
        fontsize=10,
        color="tab:orange",
    )

    for container in ax.containers:
        ax.bar_label(container, fmt="%.3f", padding=3, fontsize=8)

    plt.tight_layout()
    plt.savefig(output_path, dpi=220, bbox_inches="tight")
    plt.close()


def main():
    base = Path("evaluation_outputs")
    summary_csv = base / "recommender_eval_summary.csv"

    if not summary_csv.exists():
        raise FileNotFoundError(f"Chýba súbor: {summary_csv}")

    df = pd.read_csv(summary_csv)

    plots_dir = base / "plots"
    plots_dir.mkdir(parents=True, exist_ok=True)

    build_grouped_plot(
        df=df,
        metrics=["precision@5", "recall@5", "map@5", "ndcg@5"],
        title="Porovnanie výsledkov odporúčania v základnom experimente (@5)",
        output_path=plots_dir / "combined_at_5.png",
    )

    build_grouped_plot(
        df=df,
        metrics=["precision@10", "recall@10", "map@10", "ndcg@10"],
        title="Porovnanie výsledkov odporúčania v základnom experimente (@10)",
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

    per_user_csv = base / "recommender_eval_per_user.csv"

    if per_user_csv.exists():
        per_user_df = pd.read_csv(per_user_csv)

        per_user_metrics = [
            (
                "ndcg@10",
                "Porovnanie výsledkov jednotlivých používateľov v základnom experimente (nDCG@10)",
                "per_user_ndcg_at_10.png",
            ),
        ]

        for metric, title, filename in per_user_metrics:
            build_per_user_metric_plot(
                df=per_user_df,
                metric=metric,
                title=title,
                output_path=plots_dir / filename,
            )
    else:
        print(
            f"Per-user graf sa nevygeneroval, pretože súbor neexistuje: {per_user_csv}"
        )

    print(f"Grafy boli uložené do: {plots_dir}")


if __name__ == "__main__":
    main()