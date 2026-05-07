# CMS na zdieľanie a spracovanie vedeckých článkov

**Demo aplikácie:** [Pozrieť video na YouTube](https://youtu.be/QBaJ1bzAgVI)

Webová aplikácia na evidovanie, správu, vyhľadávanie, odporúčanie a skupinové zdieľanie vedeckých článkov. Projekt vznikol ako implementačný výstup diplomovej práce na Fakulte matematiky, fyziky a informatiky Univerzity Komenského v Bratislave.

Systém nadväzuje na pôvodný prototyp vytvorený v bakalárskej práci a rozširuje ho o odporúčacie mechanizmy, textové reprezentácie článkov, fulltextové vyhľadávanie v PDF dokumentoch, spätnú väzbu používateľa a skupinovú komunikáciu.

## Hlavné funkcie

- pridávanie a správa vedeckých článkov vrátane PDF súborov,
- extrakcia textu a metadát z PDF dokumentov,
- evidencia názvu, abstraktu, autorov, kategórií a kľúčových slov,
- modernizované používateľské rozhranie vo frontende,
- vyhľadávanie článkov podľa metadát,
- fulltextové vyhľadávanie v obsahu PDF dokumentov,
- dva režimy fulltextového vyhľadávania:
  - presné frázové vyhľadávanie,
  - inteligentné vyhľadávanie pomocou PostgreSQL full-text search,
- výpočet podobnosti článkov pomocou vektorových reprezentácií,
- podpora modelov TF-IDF a Sentence-BERT,
- personalizované odporúčania článkov vo funkcii `Recommended For You`,
- používateľská spätná väzba na odporúčania,
- skupiny používateľov a skupinové označovanie článkov,
- skupinová komunikácia so zmienkami používateľov a referencovaním článkov.

## Použité technológie

### Backend

- Python
- Django
- Django REST Framework
- PostgreSQL
- PostgreSQL full-text search
- PyMuPDF
- scikit-learn
- SentenceTransformers

### Frontend

- React
- TypeScript
- Tailwind CSS
- shadcn/ui

## Odporúčacie mechanizmy

Systém pracuje s dvoma spôsobmi reprezentácie článkov:

- **TF-IDF** — klasická štatistická reprezentácia textu založená na váhovaní termínov,
- **Sentence-BERT** — embeddingový model vytvárajúci husté sémantické reprezentácie textu.

Každý článok je reprezentovaný vektorom vytvoreným z názvu, abstraktu, kľúčových slov, kategórií a autorov. Tieto reprezentácie sa využívajú pri určovaní podobnosti medzi článkami aj pri personalizovanom odporúčaní.

Personalizované odporúčanie vytvára profilový vektor používateľa na základe jeho interakcií so systémom, napríklad označených obľúbených článkov, skupinových označení, pozitívnej spätnej väzby a odmietnutých odporúčaní.

## Fulltextové vyhľadávanie

Okrem pôvodného metadátového vyhľadávania systém podporuje aj vyhľadávanie v plnom texte PDF dokumentov. Pri pridaní článku sa z PDF extrahuje text, ktorý sa uloží do databázy a následne sa použije pri fulltextovom vyhľadávaní.

Podporované sú dva režimy:

- **Phrase search** — hľadanie presného výskytu zadanej frázy,
- **Intelligent search** — vyhľadávanie nad indexovaným obsahom článkov pomocou PostgreSQL full-text search a radenie výsledkov podľa relevancie.

## Experimentálne vyhodnotenie

Súčasťou diplomovej práce bolo experimentálne porovnanie modelov TF-IDF a Sentence-BERT pri personalizovanom odporúčaní vedeckých článkov. Vyhodnotenie bolo realizované na vlastnom datasete 250 vedeckých článkov a sledovalo kvalitu odporúčaní v základnom aj rozšírenom scenári personalizácie.

Použité metriky:

- Precision@K,
- Recall@K,
- MAP@K,
- nDCG@K.

Výsledky ukázali, že vhodnosť modelu závisí od charakteru používateľského profilu a typu dostupných interakcií. Sentence-BERT bol prínosný najmä v jednoduchšom scenári, zatiaľ čo TF-IDF dosiahol lepšie výsledky v rozšírenom experimente s viacerými typmi používateľských signálov.

## Štruktúra projektu

```text
backend/ alebo main/       backendová časť aplikácie v Django
frontend/                  frontendová časť aplikácie v Reacte
models.py                  dátový model systému
views.py                   API endpointy a aplikačná logika
serializers.py             serializácia dát pre REST API
recommender/               logika odporúčania a textových reprezentácií
personalize.py             personalizované odporúčania
similarity.py              výpočet kosínovej podobnosti
vectorizers.py             TF-IDF a Sentence-BERT reprezentácie
