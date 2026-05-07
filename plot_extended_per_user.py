from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


def pretty_model_name(model_name: str) -> str:
    return {
        "tfidf-v1": "TF-IDF",
        "sbert-v1": "SBERT",
        "tfidf": "TF-IDF",
        "sbert": "SBERT",
        "TF-IDF": "TF-IDF",
        "SBERT": "SBERT",
    }.get(model_name, model_name)


def nacitaj_a_spoj_per_user_data() -> pd.DataFrame:
    """
    Načíta a spojí výsledky rozšíreného experimentu
    z dvoch samostatných priečinkov:
    - evaluation_outputs_extended_tfidf
    - evaluation_outputs_extended_sbert
    """

    tfidf_csv = Path("evaluation_outputs_extended_tfidf") / "extended_recommender_eval_per_user.csv"
    sbert_csv = Path("evaluation_outputs_extended_sbert") / "extended_recommender_eval_per_user.csv"

    if not tfidf_csv.exists():
        raise FileNotFoundError(f"Chýba súbor: {tfidf_csv}")

    if not sbert_csv.exists():
        raise FileNotFoundError(f"Chýba súbor: {sbert_csv}")

    tfidf_df = pd.read_csv(tfidf_csv)
    sbert_df = pd.read_csv(sbert_csv)

    tfidf_df["model"] = "tfidf-v1"
    sbert_df["model"] = "sbert-v1"

    df = pd.concat([tfidf_df, sbert_df], ignore_index=True)
    return df


def normalizuj_stlpce(df: pd.DataFrame) -> pd.DataFrame:
    """
    Zjednotenie názvov stĺpcov, keby sa niekde líšili.
    """
    df = df.copy()

    if "username" not in df.columns and "user" in df.columns:
        df = df.rename(columns={"user": "username"})

    if "username" not in df.columns and "user_id" in df.columns:
        df = df.rename(columns={"user_id": "username"})

    required = {"username", "model"}
    missing = required - set(df.columns)

    if missing:
        raise ValueError(f"V CSV chýbajú povinné stĺpce: {sorted(missing)}")

    return df


def vytvor_per_user_graf(
    df: pd.DataFrame,
    metric: str,
    title: str,
    output_path: Path,
):
    required_columns = {"username", "model", metric}
    missing_columns = required_columns - set(df.columns)

    if missing_columns:
        print(f"Preskakujem metriku {metric}, chýbajú stĺpce: {sorted(missing_columns)}")
        return

    pretty = df.copy()
    pretty["model"] = pretty["model"].apply(pretty_model_name)

    pivot = pretty.pivot(index="username", columns="model", values=metric)

    expected_order = ["TF-IDF", "SBERT"]
    existing_columns = [col for col in expected_order if col in pivot.columns]

    if len(existing_columns) < 2:
        print(f"Preskakujem metriku {metric}, nenašli sa oba modely TF-IDF a SBERT.")
        return

    pivot = pivot[existing_columns]

    pivot["priemer"] = pivot.mean(axis=1)
    pivot = pivot.sort_values("priemer", ascending=False).drop(columns=["priemer"])

    ax = pivot.plot(kind="bar", figsize=(9, 6))

    ax.set_title(title, fontsize=16, pad=16)
    ax.set_xlabel("Používateľ", fontsize=12)
    ax.set_ylabel(metric, fontsize=12)

    max_value = float(pivot.max().max()) if not pivot.empty else 1.0
    ax.set_ylim(0, min(1.05, max_value + 0.15))

    ax.tick_params(axis="x", rotation=0)
    ax.legend(title="Model")
    ax.grid(axis="y", alpha=0.25)

    priemer_tfidf = float(pivot["TF-IDF"].mean())
    priemer_sbert = float(pivot["SBERT"].mean())

    ax.axhline(priemer_tfidf, linestyle="--", linewidth=1.2, color="tab:blue")
    ax.axhline(priemer_sbert, linestyle="--", linewidth=1.2, color="tab:orange")

    ax.text(
        0.99,
        priemer_tfidf + 0.025,
        f"Priemer TF-IDF: {priemer_tfidf:.4f}",
        transform=ax.get_yaxis_transform(),
        ha="right",
        va="bottom",
        fontsize=10,
        color="tab:blue",
    )

    ax.text(
        0.99,
        priemer_sbert + 0.03,
        f"Priemer SBERT: {priemer_sbert:.4f}",
        transform=ax.get_yaxis_transform(),
        ha="right",
        va="top",
        fontsize=10,
        color="black",
    )
    for container in ax.containers:
        ax.bar_label(container, fmt="%.3f", padding=3, fontsize=9)

    plt.tight_layout()
    plt.savefig(output_path, dpi=220, bbox_inches="tight")
    plt.close()


def main():
    plots_dir = Path("evaluation_outputs_extended_compare") / "plots"
    plots_dir.mkdir(parents=True, exist_ok=True)

    df = nacitaj_a_spoj_per_user_data()
    df = normalizuj_stlpce(df)

    metrics = [
        (
            "ndcg@10",
            "Porovnanie výsledkov používateľských profilov v rozšírenom experimente (nDCG@10)",
            "extended_per_user_ndcg_at_10.png",
        ),
    ]

    for metric, title, filename in metrics:
        vytvor_per_user_graf(
            df=df,
            metric=metric,
            title=title,
            output_path=plots_dir / filename,
        )

    print(f"Hotovo. Grafy sú uložené v: {plots_dir.resolve()}")


if __name__ == "__main__":
    main()