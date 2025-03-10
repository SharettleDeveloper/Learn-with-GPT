以下は、提供された「6. Expressions」章の日本語訳です。

---

# 6. 式

この章では、Python における式の要素の意味について説明します。

※ 注意: この章および以降の章では、拡張 BNF 記法を用いて構文を記述します（字句解析ではなく）。  
もし構文規則が

```
name ::= othername
```

の形をとり、特に意味が記述されていない場合、**name** の意味は **othername** と同じです。

---

## 6.1. 算術変換

以下の算術演算子の説明で「数値引数が共通の型に変換される」という表現がある場合、これは組み込み型の演算子実装が次のように動作することを意味します：

- いずれかの引数が複素数であれば、もう一方は複素数に変換される。
- そうでなければ、いずれかの引数が浮動小数点数であれば、もう一方は浮動小数点数に変換される。
- それ以外の場合、両方とも整数であり、変換は不要である。

なお、特定の演算子（例: 左側が文字列である % 演算子）の場合、追加の規則が適用されます。拡張機能は独自の変換動作を定義する必要があります。

---

## 6.2. アトム

アトムは式の最も基本的な要素です。最も単純なアトムは、識別子またはリテラルです。丸括弧、角括弧、波括弧で囲まれた形も、構文上はアトムに分類されます。アトムの構文は以下の通りです：

```
atom      ::= identifier | literal | enclosure
enclosure ::= parenth_form | list_display | dict_display | set_display
              | generator_expression | yield_atom
```

---

### 6.2.1. 識別子（名前）

アトムとして現れる識別子は名前です。識別子の字句的定義については「Identifiers and keywords」を、名前付けと束縛の詳細については「Naming and binding」を参照してください。

名前がオブジェクトに束縛されている場合、そのアトムの評価はそのオブジェクトを返します。名前が束縛されていなければ、評価時に `NameError` 例外が発生します。

#### 6.2.1.1. プライベートな名前のマングリング

クラス定義内で、テキスト上で識別子がアンダースコア２つ以上で始まり、かつアンダースコア２つ以上で終わらない場合、その識別子はそのクラスのプライベートな名前とみなされます。

詳細は「The class specifications」を参照してください。  
より正確には、コード生成前にプライベートな名前はより長い形に変換されます。変換後の名前が 255 文字を超える場合、実装依存の切り詰めが行われることがあります。

この変換は識別子が使用される構文的文脈には依存せず、次のプライベート識別子のみが変換対象となります：

- 変数の名前（読み書きされるもの）や、アクセスされる属性の名前。  
  ※ ただし、ネストされた関数、クラス、型エイリアスの `__name__` 属性は変換されません。
- モジュールのインポート時の名前（例: `import __spam` における `__spam`）。  
  ただし、モジュールがパッケージの一部（名前にドットを含む）である場合、変換は行われません（例: `import __foo.bar` の `__foo` は変換されない）。
- インポートされるメンバーの名前（例: `from spam import __f` における `__f`）。

変換ルールは次の通りです：

- クラス名から先頭のアンダースコアを取り除いたものに、先頭に１つのアンダースコアを付けた文字列を、識別子の前に挿入します。  
  例: クラス名が `Foo`、`_Foo`、または `__Foo` の場合、アトム中の `__spam` は `_Foo__spam` に変換されます。
- クラス名がアンダースコアのみの場合は、変換は恒等写像となり、例えばクラス名が `_` または `__` の場合、`__spam` はそのままになります。

---

### 6.2.2. リテラル

Python は文字列およびバイト列リテラル、また各種数値リテラルをサポートします：

```
literal ::= stringliteral | bytesliteral
            | integer | floatnumber | imagnumber
```

リテラルの評価は、指定された型（文字列、バイト、整数、浮動小数点数、複素数）のオブジェクトを、与えられた値で生成します。浮動小数点数および虚数リテラルの場合、値は近似される場合があります。詳細は「Literals」セクションを参照してください。

すべてのリテラルは不変なデータ型に対応しているため、オブジェクトの同一性よりも値が重要となります。プログラム内で同じ値のリテラルを複数回評価しても、同じオブジェクトが返される場合もあれば、同じ値を持つ別のオブジェクトが返される場合もあります。

---

### 6.2.3. 丸括弧で囲まれた形式

丸括弧で囲まれた形式は、オプションの式リストを丸括弧で囲んだものです：

```
parenth_form ::= "(" [starred_expression] ")"
```

丸括弧で囲まれた式リストは、その式リストが返すものを返します。

- 式リストに少なくとも 1 つのコンマが含まれていれば、タプルを返します。
- そうでなければ、式リストを構成する単一の式の値を返します。

空の丸括弧は空のタプルオブジェクトを返します。タプルは不変であるため、リテラルと同様の扱いとなります（空のタプルの複数回の評価で同じオブジェクトが返されるとは限りません）。

※ 注意: タプルは括弧によって作られるのではなく、コンマによって作られます。例外として空のタプルは括弧が必要です。括弧なしで「何もない」状態を表現できると曖昧さが生じ、一般的なタイプミスが検出されにくくなります。

---

### 6.2.4. リスト、セット、辞書のディスプレイ

リスト、セット、辞書を構築するために、Python は「ディスプレイ」と呼ばれる特殊な構文を提供します。これらには、要素が明示的に列挙される方法と、内包表記（comprehension）によって算出される方法の２種類があります。

共通の内包表記の構文要素は以下の通りです：

```
comprehension ::= assignment_expression comp_for
comp_for      ::= ["async"] "for" target_list "in" or_test [comp_iter]
comp_iter     ::= comp_for | comp_if
comp_if       ::= "if" or_test [comp_iter]
```

内包表記は、単一の式に続き、少なくとも 1 つの for 節および 0 個以上の for または if 節から構成されます。内包表記が実行されると、新たなコンテナの要素は、左から右へネストされたブロックとして各 for/if 節を考慮し、内側のブロックに到達するたびに式を評価して得られた要素となります。

ただし、最も左の for 節の反復可能な式以外は、内包表記は別の暗黙的にネストされたスコープで実行されます。これにより、ターゲットリストで割り当てられた名前が外側のスコープに漏れ出すのを防ぎます。

- 最も左の for 節の反復可能な式は外側のスコープで直接評価され、その後、暗黙のネストされたスコープに引数として渡されます。
- それ以降の for 節や最も左の for 節に含まれるフィルター条件は、外側のスコープで評価されることはなく、最初の反復可能オブジェクトから得られる値に依存するため、暗黙のスコープ内で評価されます。

例:

```python
[x * y for x in range(10) for y in range(x, x+10)]
```

内包表記が適切な型のコンテナを常に生成するために、暗黙のネストされたスコープ内では `yield` および `yield from` 式は使用できません。

Python 3.6 以降、`async def` 関数内では `async for` 節を用いて非同期イテレータを反復処理できます。`async def` 関数内の内包表記は、先行する式に続いて for 節または async for 節から構成され、さらに追加の for/async for 節や await 式を含むことができます。

- もし内包表記に async for 節が含まれている場合、または await 式やその他の非同期内包表記が最も左の for 節以外の場所にある場合、それは非同期内包表記と呼ばれます。
- 非同期内包表記は、その中に現れるコルーチン関数の実行を一時停止させる可能性があります。

---

### 6.2.5. リストディスプレイ

リストディスプレイは、角括弧で囲まれた、空または複数の式の列です：

```
list_display ::= "[" [flexible_expression_list | comprehension] "]"
```

リストディスプレイは、新しいリストオブジェクトを返します。内容は、単純な式のリストまたは内包表記によって指定されます。

- 複数の式がコンマ区切りで与えられた場合、左から順に評価され、その順序でリストに格納されます。
- 内包表記が与えられた場合、内包表記の結果の要素からリストが構築されます。

---

### 6.2.6. セットディスプレイ

セットディスプレイは、中括弧で示され、辞書ディスプレイと区別されるのはキーと値を区切るコロンがない点です：

```
set_display ::= "{" (flexible_expression_list | comprehension) "}"
```

セットディスプレイは、新しい可変のセットオブジェクトを返します。内容は、式の列または内包表記で指定されます。

- 複数の式がコンマ区切りで与えられた場合、左から順に評価され、セットに追加されます。
- 内包表記が与えられた場合、その結果の要素からセットが構築されます。

※ 注意: 空のセットは `{}` では構築できません。このリテラルは空の辞書を作成します。

---

### 6.2.7. 辞書ディスプレイ

辞書ディスプレイは、中括弧で囲まれた、辞書の項目（キーと値のペア）の列です：

```
dict_display       ::= "{" [dict_item_list | dict_comprehension] "}"
dict_item_list     ::= dict_item ("," dict_item)* [","]
dict_item          ::= expression ":" expression | "**" or_expr
dict_comprehension ::= expression ":" expression comp_for
```

辞書ディスプレイは、新しい辞書オブジェクトを返します。

- 複数の辞書項目がコンマ区切りで与えられた場合、左から順に評価され、各キーと値のペアが辞書に挿入されます。  
  同じキーが複数回指定されると、最終的に右側（後に評価された）の値がそのキーに対して保持されます。
- `**` を用いた辞書のアンパッキングは、オペランドがマッピングである必要があります。各マッピングの項目が新しい辞書に追加され、後の値が前の値を上書きします。

PEP 448（Python 3.5 以降）により、辞書ディスプレイへのアンパッキングが追加されました。

内包表記による辞書作成は、リストやセットの内包表記と異なり、キーと値の 2 つの式とコロン、その後に通常の for/if 節が続く必要があります。内包表記実行時、生成されたキーと値の組が、生成された順に新しい辞書に挿入されます。

※ キーの型に関する制限は、「The standard type hierarchy」セクションに記載されています（要するに、キーはハッシュ可能でなければならず、可変なオブジェクトは除外されます）。

Python 3.8 以前では、辞書内包表記におけるキーと値の評価順序は明確に定義されていませんでしたが、CPython では値がキーより先に評価されていました。PEP 572 の提案により、3.8 以降はキーが先に評価され、その後値が評価されます。

---

### 6.2.8. ジェネレーター式

ジェネレーター式は、丸括弧で囲まれた簡潔なジェネレーター表記です：

```
generator_expression ::= "(" expression comp_for ")"
```

ジェネレーター式は、新しいジェネレーターオブジェクトを返します。構文は内包表記と同様ですが、角括弧や中括弧の代わりに丸括弧で囲まれる点が異なります。

ジェネレーター式内の変数は、通常のジェネレーターと同様に、ジェネレーターオブジェクトの `__next__()` メソッドが呼ばれるまで遅延評価されます。ただし、最も左の for 節にある反復可能な式は、定義時に直ちに評価され、エラーがあればその時点で発生します。  
それ以降の for 節およびフィルター条件は、前述のように外側のスコープでは評価されず、暗黙のスコープ内で評価されます。

※ 補足: 呼び出しに引数が 1 つだけの場合、丸括弧は省略可能です（詳細は「Calls」セクションを参照）。

ジェネレーター自身の動作を妨げないよう、暗黙に定義されるジェネレーター内では `yield` および `yield from` 式は使用禁止です。

もしジェネレーター式が async for 節または await 式を含む場合、それは非同期ジェネレーター式と呼ばれ、新たな非同期ジェネレーターオブジェクト（非同期イテレータ）が返されます。

Python 3.6 以降、非同期ジェネレーター式が導入されました。  
Python 3.7 以降、非同期ジェネレーター式は async def コルーチン内以外でも使用可能です。  
Python 3.8 以降、暗黙のスコープ内での yield および yield from の使用は禁止されています。

---

### 6.2.9. yield 式

```
yield_atom       ::= "(" yield_expression ")"
yield_from       ::= "yield" "from" expression
yield_expression ::= "yield" yield_list | yield_from
```

`yield` 式は、ジェネレーター関数や非同期ジェネレーター関数を定義する際に使用され、関数定義の本体内でのみ使えます。

- 関数内で `yield` 式を使用すると、その関数はジェネレーター関数となり、呼び出すとジェネレーター（イテレータ）が返されます。
- 非同期関数（`async def`）内で使用すると、その関数は非同期ジェネレーター関数となります。

例えば：

```python
def gen():      # ジェネレーター関数の定義
    yield 123

async def agen():  # 非同期ジェネレーター関数の定義
    yield 123
```

内包表記やジェネレーター式の暗黙のスコープ内では、その副作用のために `yield` 式は使用できません（Python 3.8 以降）。

ジェネレーター関数が呼ばれると、ジェネレーターと呼ばれるイテレータが返され、そのジェネレーターが関数の実行を制御します。実行は、ジェネレーターのメソッドが呼ばれたときに開始され、最初の `yield` 式まで進んでそこで一時停止し、`yield_list` の値が呼び出し元に返されます（`yield_list` が省略されれば `None` が返される）。  
「一時停止」とは、局所状態（ローカル変数の束縛、命令ポインタ、内部評価スタック、例外処理状態など）が保持されることを意味します。  
実行再開時（例えば、`send()` メソッドによる再開）には、`yield` 式は外部からの呼び出しと同様に動作し、その結果は再開を行ったメソッドに依存します。

- `__next__()` を使って再開する場合、`yield` 式の結果は常に `None` となります。
- 一方、`send()` を使って再開すると、送信された値が `yield` 式の値となります。

これにより、ジェネレーター関数はコルーチンに似た動作をし、複数回 `yield` し、複数の再開ポイントを持つことになります。ただし、ジェネレーター関数は自ら実行の継続位置を制御できず、制御は常に呼び出し元に戻ります。

`yield from <expr>` を使用する場合、与えられる式は反復可能なオブジェクトでなければなりません。  
その反復によって生成された値は、現在のジェネレーターの呼び出し元に直接渡されます。  
`send()` や `throw()` によって渡された値や例外は、下位のイテレータが対応するメソッドを持っていれば、そのメソッドに渡されます。持っていなければ、`send()` は `AttributeError` または `TypeError` を、`throw()` は渡された例外を直ちに発生させます。

下位のイテレータが完了すると、発生した `StopIteration` 例外の `value` 属性が `yield` 式の値となります。  
この値は、`StopIteration` を明示的に発生させた場合、またはサブジェネレーターが値を返した場合に自動的に設定されます（PEP 380 参照）。

※ 変更点（Python 3.3）: `yield from <expr>` が追加され、サブイテレータへの制御委譲が可能になりました。

また、`yield` 式が代入文の右辺に単独で現れる場合、丸括弧は省略可能です。

参照:

- PEP 255 – シンプルジェネレーター
- PEP 342 – 強化されたジェネレーターによるコルーチン
- PEP 380 – サブジェネレーターへの制御委譲の構文
- PEP 525 – 非同期ジェネレーター

---

#### 6.2.9.1. ジェネレーターイテレータのメソッド

この節では、ジェネレーターイテレータの各メソッドについて説明します。これらはジェネレーター関数の実行を制御するために使用されます。

※ 注意: ジェネレーターが既に実行中の場合にこれらのメソッドを呼び出すと、`ValueError` 例外が発生します。

- **generator.**next**()**  
  ジェネレーター関数の実行を開始、または最後に実行された `yield` 式から再開します。  
  `__next__()` 呼び出し時、現在の `yield` 式は常に `None` に評価され、次の `yield` 式に到達するまで実行が継続し、そこで得られた `yield_list` の値が返されます。  
  もし次の値が `yield` されずに関数が終了した場合、`StopIteration` 例外が発生します。  
  このメソッドは通常、for ループや組み込み関数 `next()` によって暗黙的に呼び出されます。

- **generator.send(value)**  
  ジェネレーター関数の実行を再開し、値を「送信」します。  
  `value` 引数は現在の `yield` 式の結果となり、次に yield される値が返されます。  
  もしジェネレーターが次の値を yield せずに終了すれば、`StopIteration` 例外が発生します。  
  初回に `send()` を呼び出す場合は、受け取る `yield` 式が存在しないため、引数は `None` でなければなりません。

- **generator.throw(value)**  
  または  
  **generator.throw(type[, value[, traceback]])**  
  ジェネレーターが一時停止している地点で例外を発生させ、その後 yield される次の値を返します。  
  もしジェネレーターが次の値を yield せずに終了すれば、`StopIteration` 例外が発生します。  
  もし渡された例外が捕捉されなかった場合、または異なる例外が発生した場合、その例外が呼び出し元に伝播されます。  
  後方互換のため、第二のシグネチャ（type, value, traceback を指定する形）もサポートされていますが、Python 3.12 以降は非推奨となり、将来のバージョンで削除される可能性があります。

- **generator.close()**  
  ジェネレーターが一時停止している地点で `GeneratorExit` 例外を発生させます。  
  もしジェネレーター関数が例外を捕捉して値を返した場合、その値が `close()` の返り値となります。  
  ジェネレーターが既に閉じられている場合、または `GeneratorExit` を発生させた結果例外が捕捉されなかった場合、`close()` は `None` を返します。  
  もしジェネレーターが値を yield すれば、`RuntimeError` が発生します。  
  もし他の例外が発生した場合、それは呼び出し元に伝播されます。  
  ※ Python 3.13 以降: ジェネレーターが閉じられる際に値を返した場合、その値が `close()` の返り値となります。

---

#### 6.2.9.2. 例

以下は、ジェネレーターとジェネレーター関数の動作を示す簡単な例です：

```python
def echo(value=None):
    print("最初に next() が呼ばれると実行が開始されます。")
    try:
        while True:
            try:
                value = (yield value)
            except Exception as e:
                value = e
    finally:
        print("close() が呼ばれたときは、後始末を忘れないでください。")

generator = echo(1)
print(next(generator))
# 出力:
# 最初に next() が呼ばれると実行が開始されます。
# 1

print(next(generator))
# 出力: None

print(generator.send(2))
# 出力: 2

generator.throw(TypeError, "spam")
# 出力: TypeError('spam',)

generator.close()
# 出力: Don't forget to clean up when 'close()' is called.
```

yield from を使用した例については、PEP 380「Syntax for Delegating to a Subgenerator」と「What’s New in Python」を参照してください。

---

#### 6.2.9.3. 非同期ジェネレーター関数

`async def` で定義された関数内で yield 式が存在すると、その関数は非同期ジェネレーター関数となります。

非同期ジェネレーター関数が呼ばれると、非同期イテレータである非同期ジェネレーターオブジェクトが返され、そのオブジェクトが関数の実行を制御します。  
非同期ジェネレーターオブジェクトは、通常、`async for` 文内で使用され、通常のジェネレーターオブジェクトが for 文内で使用されるのと同様の動作をします。

非同期ジェネレーターのメソッドのいずれかを呼び出すと awaitable オブジェクトが返され、そのオブジェクトが await されたときに実行が開始されます。  
その時、実行は最初の yield 式まで進み、yield_list の値が待機中のコルーチンに返されます。一時停止状態では、ローカル状態（ローカル変数、命令ポインタ、内部評価スタック、例外処理状態など）が保持されます。  
実行再開時（例: `__anext__()` や `asend()` による再開）には、`yield` 式は外部呼び出しと同様に動作します。

- `__anext__()` を使った場合、結果は `None` となります。
- 一方、`asend()` を使った場合、送信された値が `yield` 式の値となります。

もし非同期ジェネレーターが break やタスクのキャンセル、その他の例外により早期終了する場合、非同期ジェネレーターのクリーンアップコードが実行され、例外が発生する可能性があります。  
これを防ぐため、呼び出し側は非同期ジェネレーターを明示的に `aclose()` メソッドで閉じ、ジェネレーターを最終化してイベントループから切り離す必要があります。

非同期ジェネレーター関数内では、try 節内で yield 式を使用できますが、もし非同期ジェネレーターが再開される前に最終化されると、try 節内の yield 式が保留中の finally 節の実行を妨げる可能性があります。  
その場合、イベントループまたはスケジューラが非同期ジェネレーターの `aclose()` メソッドを呼び出し、返されたコルーチンオブジェクトを実行して、保留中の finally 節を実行できるようにする責任があります。

イベントループ終了時に最終化を適切に処理するため、イベントループは非同期ジェネレーターイテレータを引数に取り、`aclose()` を呼び出してコルーチンを実行する最終化関数を定義すべきです。  
この最終化関数は、`sys.set_asyncgen_hooks()` を通じて登録されます。  
最初に反復処理が始まると、非同期ジェネレーターイテレータは、最終化時に呼び出される登録済みの最終化関数を保持します。  
※ なお、非同期ジェネレーター関数内での `yield from <expr>` は構文エラーとなります。

---

#### 6.2.9.4. 非同期ジェネレーターイテレータのメソッド

この節では、非同期ジェネレーターイテレータの各メソッドについて説明します。これらは非同期ジェネレーター関数の実行を制御するために使用されます。

- **async agen.**anext**()**  
  await 可能なオブジェクトを返します。これが実行されると、非同期ジェネレーターの実行が開始または、最後に実行された yield 式から再開されます。  
  再開時、現在の yield 式は awaitable 内で常に `None` と評価され、次の yield 式まで実行が進みます。  
  yield_list の値は、非同期ジェネレーターが完了する際に発生する `StopIteration` 例外の値となります。  
  もし非同期ジェネレーターが次の値を yield せずに終了すれば、awaitable は `StopAsyncIteration` 例外を発生させ、非同期反復が完了したことを示します。  
  このメソッドは通常、`async for` ループによって暗黙的に呼び出されます。

- **async agen.asend(value)**  
  await 可能なオブジェクトを返し、これが実行されると非同期ジェネレーターの実行が再開され、`value` が現在の yield 式の結果となります。  
  awaitable が実行されると、次に yield された値が返されます。  
  非同期ジェネレーターの初回呼び出し時には、送信できる yield 式が存在しないため、`value` は `None` でなければなりません。

- **async agen.athrow(value)**  
  または  
  **async agen.athrow(type[, value[, traceback]])**  
  await 可能なオブジェクトを返し、これが実行されると、非同期ジェネレーターが一時停止している地点で、指定された型の例外が発生します。  
  次に yield される値が、発生した `StopIteration` 例外の値として返されます。  
  もし非同期ジェネレーターが次の値を yield せずに終了すれば、awaitable は `StopAsyncIteration` 例外を発生させます。  
  もしジェネレーター関数が渡された例外を捕捉せず、または異なる例外を発生させた場合、awaitable の実行時にその例外が呼び出し元に伝播されます。  
  ※ Python 3.12 以降: 第二のシグネチャ（type[, value[, traceback]]）は非推奨となり、将来のバージョンで削除される可能性があります。

- **async agen.aclose()**  
  await 可能なオブジェクトを返し、これが実行されると、非同期ジェネレーターの一時停止地点で `GeneratorExit` 例外が発生します。  
  もし非同期ジェネレーター関数が正常に終了、または `GeneratorExit` を発生させた場合、awaitable は `StopIteration` 例外を発生させます。  
  以降、同じ非同期ジェネレーターからの awaitable 呼び出しは、`StopAsyncIteration` 例外を発生させます。  
  もし非同期ジェネレーターが値を yield すれば、`RuntimeError` が発生します。  
  もし他の例外が発生すれば、その例外が呼び出し元に伝播されます。  
  すでに非同期ジェネレーターが例外または通常終了している場合、以降の `aclose()` 呼び出しは何もしない awaitable を返します。

---

## 6.3. プライマリ

プライマリは、Python における最も強く結合する演算子（つまり、結合力が最も高い）の操作を表します。  
構文は以下の通りです：

```
primary ::= atom | attributeref | subscription | slicing | call
```

---

### 6.3.1. 属性参照

属性参照は、プライマリの後にピリオドと名前が続く形です：

```
attributeref ::= primary "." identifier
```

プライマリは属性参照をサポートする型のオブジェクトでなければならず、ほとんどのオブジェクトはこれをサポートします。  
その後、対象のオブジェクトに対して、指定された名前の属性が生成されるよう要求されます。  
生成される型や値はオブジェクト次第です。同一の属性参照を複数回評価しても、異なるオブジェクトが返される場合があります。

この動作は、`__getattribute__()` または `__getattr__()` メソッドをオーバーライドすることでカスタマイズ可能です。  
`__getattribute__()` が最初に呼び出され、値を返すか、属性が存在しない場合は `AttributeError` を発生させます。  
もし `AttributeError` が発生し、オブジェクトが `__getattr__()` メソッドを持っていれば、そのメソッドがフォールバックとして呼び出されます。

---

### 6.3.2. 添字

コンテナクラスのインスタンスに対する添字演算は、通常、コンテナから要素を選択します。  
汎用クラスの場合、添字演算は一般に `GenericAlias` オブジェクトを返します。

```
subscription ::= primary "[" flexible_expression_list "]"
```

オブジェクトが添字でアクセスされると、まずプライマリと式リストが評価されます。  
プライマリは添字操作をサポートするオブジェクトでなければならず、これは `__getitem__()` または `__class_getitem__()` を定義することでサポートされます。  
評価された式リストは、これらのメソッドのいずれかに渡されます。  
もし式リストに少なくとも 1 つのコンマが含まれている、または式の中に starred な要素がある場合、式リストはタプルとして評価されます。  
そうでなければ、式リストはその単一の値として評価されます。

※ Python 3.11 以降: 式リスト内の式は starred 可能となりました（PEP 646 参照）。

組み込みオブジェクトの場合、添字をサポートする主な対象は次の 2 種類です：

- **マッピング型:**  
  プライマリがマッピングの場合、式リストはマッピングのキーの 1 つとなるオブジェクトに評価され、そのキーに対応する値が返されます。例として `dict` クラスがあります。

- **シーケンス型:**  
  プライマリがシーケンスの場合、式リストは整数またはスライスに評価される必要があります。例として `str`、`list`、`tuple` などがあります。

組み込みシーケンスは、`__getitem__()` メソッド内で負のインデックスを、シーケンスの長さを加えることで解釈します。例えば、`x[-1]` は `x` の最後の要素を選びます。結果の値は、シーケンス内の要素数より小さい非負整数でなければなりません。

文字列は、要素が文字であるシーケンスの一種です。文字は別個のデータ型ではなく、長さ１の文字列として扱われます。

---

### 6.3.3. スライシング

スライシングは、シーケンス（文字列、タプル、リストなど）の範囲を選択します。  
スライシングは、式としても、代入文や del 文のターゲットとしても使用できます。  
スライシングの構文は以下の通りです：

```
slicing      ::= primary "[" slice_list "]"
slice_list   ::= slice_item ("," slice_item)* [","]
slice_item   ::= expression | proper_slice
proper_slice ::= [lower_bound] ":" [upper_bound] [ ":" [stride] ]
lower_bound  ::= expression
upper_bound  ::= expression
stride       ::= expression
```

※ 注意: 形式上、式リストとスライスリストは見た目が同じため、添字がスライシングかどうかは解釈により決定されます。  
もしスライスリストに proper_slice が含まれていなければ、添字と解釈されます。

スライシングの意味論は以下の通りです。  
プライマリは、スライスリストから構築されたキーを用いて添字されます。

- スライスリストにコンマが含まれている場合、キーはスライス項目の変換結果からなるタプルとなります。
- 単一のスライス項目の場合、その項目の変換結果がキーとなります。
- 式の場合、そのまま評価結果となります。
- proper_slice の場合、`slice` オブジェクトが生成され、その `start`、`stop`、`step` 属性は、それぞれ lower_bound、upper_bound、stride の評価結果となり、欠落している部分は `None` で補われます。

---

### 6.3.4. 呼び出し（Call）

呼び出しは、呼び出し可能なオブジェクト（例: 関数）を、引数の列（場合によっては空）とともに呼び出す操作です：

```
call                 ::= primary "(" [argument_list [","] | comprehension] ")"
argument_list        ::= positional_arguments ["," starred_and_keywords]
                         ["," keywords_arguments]
                         | starred_and_keywords ["," keywords_arguments]
                         | keywords_arguments
positional_arguments ::= positional_item ("," positional_item)*
positional_item      ::= assignment_expression | "*" expression
starred_and_keywords ::= ("*" expression | keyword_item)
                         ("," "*" expression | "," keyword_item)*
keywords_arguments   ::= (keyword_item | "**" expression)
                         ("," keyword_item | "," "**" expression)*
keyword_item         ::= identifier "=" expression
```

末尾のコンマはオプションですが、意味には影響しません。

呼び出しにおいて、プライマリは呼び出し可能なオブジェクトでなければならず、すべての引数の式は呼び出し前に評価されます。  
関数定義の形式パラメータリストの構文については「Function definitions」を参照してください。

キーワード引数がある場合、その引数はまず位置引数に変換されます。

- 最初に、形式パラメータ用の未充填スロットのリストが作成され、位置引数が左から順に充填されます。
- 次に、各キーワード引数について、識別子により対応するスロットが決定され、既に埋まっていれば `TypeError` が発生し、そうでなければ引数がそのスロットに配置されます。
- すべての引数が処理された後、未充填のスロットは関数定義内のデフォルト値で埋められます。  
  ※ デフォルト値は関数定義時に一度だけ計算されるため、可変オブジェクト（例: リストや辞書）をデフォルト値に用いるのは注意が必要です。
- 未充填スロットが存在し、デフォルト値も指定されていなければ `TypeError` が発生します。
- 最終的に、充填されたスロットのリストが呼び出しの引数リストとして使用されます。

※ CPython の実装上: 組み込み関数で位置引数に名前がないもの（ドキュメント上は名前が示されているが実際にはキーワードで指定できないもの）も存在します。これらは C 言語で実装され、`PyArg_ParseTuple()` を使用して引数が解析されるためです。

もし位置引数が形式パラメータの数を超える場合、`*identifier` を使用した形式パラメータが存在すれば、余剰の位置引数はタプルとしてそのパラメータに渡されます（存在しなければ `TypeError` が発生します）。

キーワード引数で形式パラメータに対応しないものがあれば、`**identifier` を使用したパラメータが存在すれば、余剰のキーワード引数は辞書としてそのパラメータに渡され、存在しなければ `TypeError` が発生します。

`*expression` の形が呼び出しに現れる場合、expression は反復可能でなければならず、その要素が追加の位置引数として展開されます。  
例: `f(x1, x2, *y, x3, x4)` で、`y` がシーケンス `[y1, …, yM]` に評価されると、呼び出しは `x1, x2, y1, …, yM, x3, x4` の位置引数で実行されるのと同等です。

そのため、`*expression` は明示的なキーワード引数の後に現れても、キーワード引数より前に処理されます（`**expression` も同様）。

呼び出しは常に何らかの値（例: `None` も含む）を返します。  
その値の計算方法は、呼び出されるオブジェクトの型に依存します：

- **ユーザー定義関数:**  
  関数のコードブロックが実行され、形式パラメータに引数がバインドされ、`return` 文によって返り値が指定されます。コードブロックの最後まで到達した場合、返り値は `None` となります。

- **組み込み関数やメソッド:**  
  結果はインタプリタに依存します（詳細は「Built-in Functions」を参照）。

- **クラスオブジェクト:**  
  そのクラスの新しいインスタンスが返されます。

- **クラスのインスタンスメソッド:**  
  対応するユーザー定義関数が呼び出され、呼び出しの引数リストは 1 つ長くなり、最初の引数にインスタンス自身が渡されます。

- **クラスのインスタンス:**  
  クラスが `__call__()` メソッドを定義していれば、そのメソッドが呼び出されます。

---

## 6.4. await 式

`await` 式は、awaitable オブジェクト上でコルーチンの実行を一時停止します。  
これは、コルーチン関数内でのみ使用可能です。

```
await_expr ::= "await" primary
```

※ Python 3.5 以降で追加されました。

---

## 6.5. 冪乗演算子

冪乗演算子（\*\*）は、左側の単項演算子よりも強く結合し、右側の単項演算子よりは弱く結合します。構文は以下の通りです：

```
power ::= (await_expr | primary) ["**" u_expr]
```

そのため、括弧で囲まれていない一連の power と単項演算子の式では、右から左へと評価されます（ただし、オペランドの評価順序には制約しません）。  
例: `-1**2` は `-1` と評価されます。

冪乗演算子は、組み込み関数 `pow()`（引数が 2 つの場合）と同じ意味を持ち、左側の引数を右側の引数の冪にした値を返します。  
数値引数はまず共通の型に変換され、その型の結果が返されます。

- 整数同士の場合、第二引数が負でなければ結果の型は整数となり、負の場合は浮動小数点数に変換され、浮動小数点数の結果が返されます。  
  例: `10**2` は `100` を返し、`10**-2` は `0.01` を返します。
- 浮動小数点数で `0.0` を負の冪に上げると `ZeroDivisionError` が発生します。
- 負の数を分数の冪に上げると複素数が返されます（以前のバージョンでは `ValueError` が発生していました）。

この演算は、特殊メソッド `__pow__()` および `__rpow__()` によりカスタマイズ可能です。

---

## 6.6. 単項算術およびビット演算

すべての単項算術およびビット演算は同じ優先順位を持ちます：

```
u_expr ::= power | "-" u_expr | "+" u_expr | "~" u_expr
```

- **単項マイナス（-）:** 数値引数の符号を反転します。特殊メソッド `__neg__()` によりオーバーライド可能です。
- **単項プラス（+）:** 数値引数をそのまま返します。特殊メソッド `__pos__()` によりオーバーライド可能です。
- **単項ビット反転（~）:** 整数引数のビットごとの反転を返します。ビット反転は、`-(x+1)` と定義されます。  
  整数または `__invert__()` をオーバーライドしたカスタムオブジェクトにのみ適用され、適切な型でなければ `TypeError` が発生します。

---

## 6.7. 二項算術演算

二項算術演算子は、通常の優先順位を持ちます。  
※ 冪乗演算子を除き、乗算系と加算系の 2 段階のみがあります：

- **乗算系:**

```
m_expr ::= u_expr | m_expr "*" u_expr | m_expr "@" m_expr |
           m_expr "//" u_expr | m_expr "/" u_expr |
           m_expr "%" u_expr
```

- `*` （乗算）: 数値の場合は通常の積を、整数とシーケンスの場合はシーケンスの繰り返しを行います。  
  ※ 数値の場合、数値は共通の型に変換されます。  
  ※ この演算は特殊メソッド `__mul__()` および `__rmul__()` によりカスタマイズ可能です。

- `@` （行列乗算）: 行列の乗算用に意図されています。  
  ※ 組み込み型では実装されていませんが、特殊メソッド `__matmul__()` および `__rmatmul__()` によりカスタマイズ可能です。

- `/` （除算）および `//` （床除算）: 数値引数は共通の型に変換された後、通常の除算または床関数を適用した除算結果を返します。

  - 整数の除算は浮動小数点数となり、床除算は整数となります。
  - ゼロ除算時には `ZeroDivisionError` が発生します。  
    ※ これらはそれぞれ `__truediv__()`/`__rtruediv__()`、`__floordiv__()`/`__rfloordiv__()` によりカスタマイズ可能です。

- `%` （剰余）: 第一引数を第二引数で割った余りを返します。  
  ※ 数値引数は共通の型に変換されます。  
  ※ 第二引数がゼロの場合は `ZeroDivisionError` が発生します。  
  ※ 浮動小数点数の場合、例: `3.14 % 0.7` は `0.34`（ただし丸め誤差により近似値）となります。  
  ※ 結果の符号は第二引数（またはゼロ）と同じになります。  
  ※ この演算は特殊メソッド `__mod__()` および `__rmod__()` によりカスタマイズ可能です.

- また、床除算、剰余、および組み込み関数 `divmod()` は以下の恒等式を満たします：  
  `x == (x//y)*y + (x%y)`

- **加算系:**

```
a_expr ::= m_expr | a_expr "+" m_expr | a_expr "-" m_expr
```

- `+` （加算）: 数値同士の場合は共通の型に変換後、その和を返し、シーケンスの場合は連結を行います。  
  ※ 特殊メソッド `__add__()` および `__radd__()` によりカスタマイズ可能です。

- `-` （減算）: 数値同士の場合は共通の型に変換後、その差を返します。  
  ※ 特殊メソッド `__sub__()` および `__rsub__()` によりカスタマイズ可能です。

---

## 6.8. シフト演算

シフト演算は、加算系よりも低い優先順位を持ちます：

```
shift_expr ::= a_expr | shift_expr ("<<" | ">>") a_expr
```

これらの演算子は整数を引数とし、第一引数を第二引数のビット数だけ左または右にシフトします。

- 左シフトは、`pow(2, n)` との乗算として定義され、右シフトは `pow(2, n)` による床除算として定義されます。
- これらは、それぞれ特殊メソッド `__lshift__()`/`__rlshift__()` および `__rshift__()`/`__rrshift__()` によりカスタマイズ可能です。

---

## 6.9. 二項ビット演算

各ビット演算子はそれぞれ異なる優先順位を持ちます：

```
and_expr ::= shift_expr | and_expr "&" shift_expr
xor_expr ::= and_expr | xor_expr "^" and_expr
or_expr  ::= xor_expr | or_expr "|" xor_expr
```

- `&` （ビット AND）: 引数のビットごとの AND を返します（整数、または `__and__()`/`__rand__()` をオーバーライドしたオブジェクト）。
- `^` （ビット XOR）: 引数の排他的 OR（XOR）を返します（整数、または `__xor__()`/`__rxor__()` をオーバーライドしたオブジェクト）。
- `|` （ビット OR）: 引数の包含的 OR を返します（整数、または `__or__()`/`__ror__()` をオーバーライドしたオブジェクト）。

---

## 6.10. 比較

C 言語とは異なり、Python のすべての比較演算子は同じ優先順位を持ち、算術、シフト、ビット演算よりも低い優先順位です。  
また、`a < b < c` のような連鎖比較は、数学的に慣例的な解釈（`a < b and b < c`）となります。

```
comparison    ::= or_expr (comp_operator or_expr)*
comp_operator ::= "<" | ">" | "==" | ">=" | "<=" | "!="
                  | "is" ["not"] | ["not"] "in"
```

比較はブール値（True または False）を返します。ただし、リッチ比較メソッドをカスタマイズした場合、非ブール値が返されることもあり、その場合、ブール文脈では `bool()` が呼ばれます。

連鎖比較は、例えば `x < y <= z` は `x < y and y <= z` と同等ですが、`y` は一度だけ評価されます（ただし `z` は `x < y` が False の場合評価されません）。  
なお、`a op1 b op2 c` は `a` と `c` の比較を意味しないため、`x < y > z` は合法ですが、直感的には不自然な場合があります。

---

### 6.10.1. 値による比較

`<`, `>`, `==`, `>=`, `<=`, `!=` 演算子は、2 つのオブジェクトの値を比較します。  
オブジェクトは同じ型である必要はありません。

「Objects, values and types」章では、オブジェクトには型、同一性に加えて値が存在すると述べられています。  
ただし、オブジェクトの値は抽象的な概念であり、すべてのデータ属性から構成されるとは限りません。  
比較演算子は、オブジェクトの値を定義する一種の実装となっています。

デフォルトでは、等価比較（== および !=）はオブジェクトの同一性に基づいて行われます。  
そのため、同じ同一性を持つインスタンスは等価と判定され、異なる同一性のインスタンスは非等価と判定されます。  
このデフォルト動作は、すべてのオブジェクトが反射的（`x is y` なら `x == y`）であることを意図しています。

順序比較（<, >, <=, >=）のデフォルト動作は提供されず、試みると `TypeError` が発生します。  
これは、等価比較のような不変の性質が順序比較には存在しないためです。

値に基づく等価比較で、異なる同一性のオブジェクトは常に非等価となるのは、値に基づく意味で等価なオブジェクトを必要とする型にとっては望ましくない場合があるため、そういった型は比較動作をカスタマイズする必要があります。  
実際、多くの組み込み型はこの動作をカスタマイズしています。

以下は、主要な組み込み型における比較の動作についての説明です：

- **数値型:**  
  組み込み数値型（`int`, `float`, `complex`）および標準ライブラリの `fractions.Fraction` や `decimal.Decimal` は、型の枠内および型を超えて数学的に正確に（丸め誤差なく）比較できます。ただし、複素数は順序比較をサポートしません。

- **NaN:**  
  `float('NaN')` や `decimal.Decimal('NaN')` は特別な値です。  
  数値と NaN との順序比較は常に False となり、また NaN 自身との等価比較も False となりますが、`x != x` は True となります（IEEE 754 に準拠）。

- **None および NotImplemented:**  
  これらはシングルトンであり、比較には常に `is` や `is not` を使用すべきです。

- **バイナリシーケンス:**  
  `bytes` や `bytearray` のインスタンスは、要素の数値値に基づいて辞書順に比較されます。

- **文字列:**  
  `str` のインスタンスは、各文字の Unicode コードポイント（`ord()` の結果）に基づいて辞書順に比較されます。  
  ※ 文字列とバイナリシーケンスは直接比較できません。

- **シーケンス:**  
  `tuple`, `list`, `range` などは、同じ型内でのみ比較可能です。  
  たとえば、`[1,2] == (1,2)` は False となり、また型が異なる場合の順序比較は `TypeError` となります。  
  シーケンス同士の比較は、対応する要素同士の比較によって辞書順に行われ、最初に不等となる要素によって順序が決定されます。  
  要素が存在しない場合は、短い方が小さいとされます。

- **辞書:**  
  `dict` のインスタンスは、キーと値のペアがすべて等しい場合に等しいと判断されます。  
  順序比較は定義されず、順序比較の試みは `TypeError` を発生させます。

- **集合:**  
  `set` や `frozenset` は、互いに部分集合・上位集合関係に基づく順序比較が定義されていますが、全順序ではありません。  
  例: `{1,2}` と `{2,3}` は互いに部分集合でも上位集合でもありません。  
  そのため、`min()`, `max()`, `sorted()` のような全順序を前提とする関数への引数としては適していません。

- **その他の型:**  
  多くの組み込み型は比較メソッドを実装しておらず、デフォルトの比較動作（同一性に基づくもの）が適用されます。

ユーザー定義クラスが比較動作をカスタマイズする場合、以下の一貫性のルールに従うことが推奨されます：

- **反射性:**  
  同一のオブジェクトは等価であるべき（`x is y` なら `x == y`）。
- **対称性:**  
  `x == y` と `y == x`、また `x < y` と `y > x` は同じ結果であるべき。
- **推移性:**  
  例: `x > y` かつ `y > z` なら `x > z` であるべき。
- **逆比較:**  
  逆の比較は論理否定と同じ結果であるべき（例: `x == y` と `not (x != y)`）。
- **ハッシュ:**  
  等価なオブジェクトは同じハッシュ値を持つか、またはハッシュ不可能としてマークされるべき。

※ Python はこれらのルールを強制しません。実際、NaN の例はこれらのルールに従わない例です。

---

### 6.10.2. メンバーシップテスト

`in` および `not in` 演算子は、オブジェクトがシーケンスやコレクションのメンバーであるかをテストします。

- `x in s` は、`x` が `s` の要素であれば True、そうでなければ False を返します。
- `x not in s` はその逆です。  
  ほとんどの組み込みシーケンス、集合、辞書はこれをサポートしています（辞書の場合、キーの存在をチェックします）。

文字列およびバイト型では、`x in y` は `x` が `y` の部分文字列である場合にのみ True となります。  
これは `y.find(x) != -1` と同等です。  
空文字列は、任意の文字列の部分文字列とみなされるため、`"" in "abc"` は True となります。

ユーザー定義クラスが `__contains__()` を定義していれば、その戻り値の真偽値により `x in y` が決まります。  
定義していない場合、`__iter__()` が定義されていれば、イテレーション中に `x is e` または `x == e` となる要素が見つかれば True と判断されます。  
さらに、`__getitem__()` が定義されている場合は、非負の整数インデックスに対してアクセス可能かどうかで判断されます。

---

### 6.10.3. 同一性比較

`is` および `is not` 演算子は、オブジェクトの同一性をテストします。  
`x is y` は、`x` と `y` が同じオブジェクトである場合に True となります。  
同一性は、組み込み関数 `id()` によって決定されます。  
`x is not y` はその逆です。

---

## 6.11. ブール演算

ブール演算の構文は以下の通りです：

```
or_test  ::= and_test | or_test "or" and_test
and_test ::= not_test | and_test "and" not_test
not_test ::= comparison | "not" not_test
```

ブール演算および制御フロー文内では、以下の値が偽と解釈されます：  
`False`, `None`, すべての型の数値のゼロ、空の文字列やコンテナ（文字列、タプル、リスト、辞書、セット、frozenset など）。  
それ以外は真と解釈されます。  
ユーザー定義オブジェクトは、`__bool__()` メソッドを定義することで真偽値をカスタマイズできます。

- 演算子 `not` は、引数が偽なら True、そうでなければ False を返します。
- 式 `x and y` は、まず `x` を評価し、もし `x` が偽ならその値を返し、そうでなければ `y` を評価してその値を返します。
- 式 `x or y` は、まず `x` を評価し、もし `x` が真ならその値を返し、そうでなければ `y` を評価してその値を返します。

※ 注意: `and` や `or` は、必ずしもブール値（False, True）のみを返すわけではなく、最後に評価された式の値を返します。  
例えば、文字列 `s` が空である場合にデフォルト値を与える際、`s or 'foo'` とすると、`s` が空なら `'foo'` が返されます。  
`not` は新たな値を生成する必要がないため、常にブール値を返します（例: `not 'foo'` は `False` となる）。

---

## 6.12. 代入式

代入式（named expression、または「ウォルラス」）は、式の評価結果を識別子に代入しながら、その評価結果自体も返す構文です：

```
assignment_expression ::= [identifier ":="] expression
```

よく使われる例として、正規表現によるマッチングの処理があります：

```python
if matching := pattern.search(data):
    do_something(matching)
```

また、ファイルストリームをチャンクごとに処理する場合にも使えます：

```python
while chunk := file.read(9000):
    process(chunk)
```

代入式は、以下のような場所で使用する場合、必ず括弧で囲まれなければなりません：

- 式文として単独で使用する場合
- スライシング、条件式、ラムダ、キーワード引数、内包表記の if 節、および assert, with, 代入文の部分式として使用する場合

それ以外の場所（if や while 文内など）では括弧は不要です。

※ Python 3.8 以降: 詳細は PEP 572 を参照してください。

---

## 6.13. 条件式

条件式（時に「三項演算子」とも呼ばれる）は、最も低い優先順位を持つ演算子です：

```
conditional_expression ::= or_test ["if" or_test "else" expression]
expression             ::= conditional_expression | lambda_expr
```

式 `x if C else y` は、まず条件 `C` を評価し、もし `C` が真であれば `x` を評価してその値を返し、そうでなければ `y` を評価してその値を返します。

詳細は PEP 308 を参照してください。

---

## 6.14. ラムダ

ラムダ式は、匿名関数を作成するために使用されます：

```
lambda_expr ::= "lambda" [parameter_list] ":" expression
```

式 `lambda parameters: expression` は、関数オブジェクトを生成します。  
この無名オブジェクトは、次のように定義された関数オブジェクトと同様に動作します：

```python
def <lambda>(parameters):
    return expression
```

形式パラメータリストの構文については「Function definitions」を参照してください。  
なお、ラムダ式で作成された関数は、文や注釈を含むことはできません。

---

## 6.15. 式リスト

```
starred_expression       ::= ["*"] or_expr
flexible_expression      ::= assignment_expression | starred_expression
flexible_expression_list ::= flexible_expression ("," flexible_expression)* [","]
starred_expression_list  ::= starred_expression ("," starred_expression)* [","]
expression_list          ::= expression ("," expression)* [","]
yield_list               ::= expression_list | starred_expression "," [starred_expression_list]
```

リストやセットのディスプレイの一部でない限り、コンマを 1 つ以上含む式リストはタプルを生成します。  
タプルの長さは、リスト内の式の数です。式は左から右に評価されます。

アスタリスク `*` は、反復可能オブジェクトのアンパッキングを示します。  
そのオペランドは反復可能でなければならず、展開された項目が新しいタプル、リスト、セットの該当箇所に含まれます。

※ Python 3.5 以降: 式リスト内での反復可能オブジェクトのアンパッキングが導入されました（PEP 448）。  
※ Python 3.11 以降: 式リストの各項目は starred 可能です（PEP 646）。

末尾のコンマは、1 要素のタプル（例: `1,`）を作成する場合のみ必須であり、それ以外は任意です。  
単一の式（末尾のコンマがない場合）はタプルではなく、その式の値が返されます。  
（空のタプルを作成するには空の丸括弧 `()` を使用します。）

---

## 6.16. 評価順序

Python は、式を左から右に評価します。  
なお、代入の評価では、右辺が先に評価され、その後左辺が評価されます。

以下の例では、各式はその接尾辞の算術的順序に従って評価されます：

- `expr1, expr2, expr3, expr4`
- `(expr1, expr2, expr3, expr4)`
- `{expr1: expr2, expr3: expr4}`
- `expr1 + expr2 * (expr3 - expr4)`
- `expr1(expr2, expr3, *expr4, **expr5)`
- `expr3, expr4 = expr1, expr2`

---

## 6.17. 演算子の優先順位

以下の表は、Python における演算子の優先順位を、最も結合力が強い（優先順位が高い）ものから、最も弱い（優先順位が低い）ものへとまとめたものです。  
同じボックス内の演算子は同じ優先順位を持ちます。  
明示的に指定されていない限り、演算子は二項演算子です。  
同じボックス内の演算子は左から右にグループ化されます（ただし、冪乗演算子および条件式は右から左にグループ化されます）。

※ 比較、メンバーシップテスト、同一性テストの演算子は同じ優先順位であり、連鎖比較の特徴を持ちます。

| 演算子                                                                        | 説明                                                                                   |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------- |
| `(expressions...)`, `[expressions...]`, `{key: value...}`, `{expressions...}` | 結合力または括弧で囲まれた式、リストディスプレイ、辞書ディスプレイ、セットディスプレイ |
| `x[index]`, `x[index:index]`, `x(arguments...)`, `x.attribute`                | 添字、スライシング、呼び出し、属性参照                                                 |
| `await x`                                                                     | await 式                                                                               |
| `**`                                                                          | 冪乗演算子 ※[5]                                                                        |
| `+x`, `-x`, `~x`                                                              | 単項プラス、単項マイナス、ビット反転                                                   |
| `*`, `@`, `/`, `//`, `%`                                                      | 乗算、行列乗算、除算、床除算、剰余 ※[6]                                                |
| `+`, `-`                                                                      | 加算、減算                                                                             |
| `<<`, `>>`                                                                    | シフト                                                                                 |
| `&`                                                                           | ビット AND                                                                             |
| `^`                                                                           | ビット XOR                                                                             |
| `                                                                             | `                                                                                      | ビット OR |
| `in`, `not in`, `is`, `is not`, `<`, `<=`, `>`, `>=`, `!=`, `==`              | 比較（メンバーシップテストおよび同一性テストを含む）                                   |
| `not x`                                                                       | ブール NOT                                                                             |
| `and`                                                                         | ブール AND                                                                             |
| `or`                                                                          | ブール OR                                                                              |
| `if – else`                                                                   | 条件式                                                                                 |
| `lambda`                                                                      | ラムダ式                                                                               |
| `:=`                                                                          | 代入式                                                                                 |

---

_脚注_  
[5] 冪乗演算子 ** は、右側の算術またはビット単項演算子よりも弱く結合します。つまり、`2**-1`は`0.5`となります。  
[6]`%` 演算子は、文字列フォーマッティング（printf-style interpolation）にも使用され、同じ優先順位が適用されます。

---

© Copyright 2001-2025, Python Software Foundation.  
このページは Python Software Foundation License Version 2 の下でライセンスされています。  
ドキュメント中の例、レシピ、その他のコードは Zero Clause BSD License の下で追加ライセンスされています。  
詳細は History and License を参照してください。

Python Software Foundation は非営利団体です。  
寄付をお願いします。

最終更新: 2025 年 2 月 28 日 (08:46 UTC)  
バグを発見しましたか？  
Sphinx 8.2.1 を使用して作成されています。

---

以上が、提供された「6. Expressions」章の日本語訳です。
