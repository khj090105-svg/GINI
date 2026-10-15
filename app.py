import io
import joblib
import numpy as np
import pandas as pd
import streamlit as st
import matplotlib.pyplot as plt

from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

st.set_page_config(page_title="선형회귀 예측 웹앱", page_icon="📈", layout="wide")
st.title("📈 선형회귀 머신러닝 예측기")
st.write("CSV 데이터를 올리고, 독립변수와 예측할 변수를 선택한 뒤 모델을 학습하고 새로운 값을 예측하세요.")

with st.sidebar:
    st.header("1. 데이터 업로드")
    uploaded_file = st.file_uploader("CSV 파일 선택", type=["csv"])
    st.caption("CSV 첫 행에는 변수 이름(열 이름)이 있어야 합니다.")

if uploaded_file is None:
    st.info("시작하려면 왼쪽에서 CSV 파일을 업로드하세요. 아래 예시 데이터를 사용해 기능을 먼저 확인할 수도 있습니다.")
    use_demo = st.toggle("예시 데이터로 체험하기", value=True)
    if not use_demo:
        st.stop()
    rng = np.random.default_rng(7)
    n = 80
    df = pd.DataFrame({
        "광고비": rng.uniform(50, 300, n).round(1),
        "방문자수": rng.integers(200, 1500, n),
        "할인율": rng.uniform(0, 25, n).round(1),
    })
    df["매출"] = (150 + 4.2*df["광고비"] + 1.3*df["방문자수"] + 8*df["할인율"] + rng.normal(0, 120, n)).round(2)
else:
    try:
        df = pd.read_csv(uploaded_file)
    except Exception as e:
        st.error(f"CSV 파일을 읽지 못했습니다: {e}")
        st.stop()

st.subheader("2. 데이터 확인")
st.write(f"데이터 크기: **{df.shape[0]}행 × {df.shape[1]}열**")
st.dataframe(df.head(20), use_container_width=True)

numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
if len(numeric_cols) < 2:
    st.error("숫자형 열이 최소 2개 필요합니다. 범주형 변수는 숫자로 변환하거나 별도로 전처리해 주세요.")
    st.stop()

with st.sidebar:
    st.header("3. 모델 설정")
    target = st.selectbox("예측할 종속변수", numeric_cols, index=len(numeric_cols)-1)
    default_features = [c for c in numeric_cols if c != target]
    features = st.multiselect("독립변수", [c for c in numeric_cols if c != target], default=default_features)
    test_size = st.slider("테스트 데이터 비율", min_value=0.1, max_value=0.4, value=0.2, step=0.05)
    seed = st.number_input("랜덤 시드", min_value=0, max_value=100000, value=42, step=1)
    train_button = st.button("모델 학습하기", type="primary", use_container_width=True)

if not features:
    st.warning("독립변수를 하나 이상 선택하세요.")
    st.stop()

data = df[features + [target]].replace([np.inf, -np.inf], np.nan).dropna()
st.caption(f"선택한 변수의 결측값/무한대 값을 제외한 학습 가능 행: {len(data)}개")

if len(data) < 5:
    st.error("유효한 데이터가 너무 적습니다. 최소 5개 이상의 행을 준비하세요.")
    st.stop()

if train_button or "trained_model" not in st.session_state or st.session_state.get("model_config") != (tuple(features), target, float(test_size), int(seed), len(data)):
    X = data[features]
    y = data[target]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=float(test_size), random_state=int(seed)
    )
    model = LinearRegression()
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    st.session_state["trained_model"] = model
    st.session_state["model_config"] = (tuple(features), target, float(test_size), int(seed), len(data))
    st.session_state["eval"] = {
        "r2": r2_score(y_test, pred) if len(y_test) >= 2 else np.nan,
        "mse": mean_squared_error(y_test, pred),
        "rmse": float(np.sqrt(mean_squared_error(y_test, pred))),
        "mae": mean_absolute_error(y_test, pred),
        "actual": np.asarray(y_test),
        "pred": np.asarray(pred),
        "coef": model.coef_,
        "intercept": model.intercept_,
        "X_train": X_train,
        "y_train": y_train,
        "X_test": X_test,
        "y_test": y_test,
    }

model = st.session_state["trained_model"]
ev = st.session_state["eval"]

st.subheader("4. 모델 성능")
c1, c2, c3, c4 = st.columns(4)
c1.metric("R²", f"{ev['r2']:.4f}" if np.isfinite(ev["r2"]) else "계산 불가")
c2.metric("MSE", f"{ev['mse']:.4f}")
c3.metric("RMSE", f"{ev['rmse']:.4f}")
c4.metric("MAE", f"{ev['mae']:.4f}")
st.caption("R²는 테스트 데이터에 대한 값이며 음수가 될 수도 있습니다. 성능 지표는 데이터 분할에 따라 달라질 수 있습니다.")

st.subheader("5. 학습된 회귀식")
equation = f"{target} = {model.intercept_:.5g}"
for f, coef in zip(features, model.coef_):
    equation += f" {'+' if coef >= 0 else '−'} {abs(coef):.5g} × {f}"
st.code(equation, language=None)
coef_df = pd.DataFrame({"독립변수": features, "회귀계수": model.coef_})
st.dataframe(coef_df, use_container_width=True)

left, right = st.columns(2)
with left:
    st.subheader("6. 실제값 vs 예측값")
    fig, ax = plt.subplots()
    ax.scatter(ev["actual"], ev["pred"])
    lo = min(float(np.min(ev["actual"])), float(np.min(ev["pred"])))
    hi = max(float(np.max(ev["actual"])), float(np.max(ev["pred"])))
    ax.plot([lo, hi], [lo, hi], linestyle="--")
    ax.set_xlabel("실제값")
    ax.set_ylabel("예측값")
    ax.grid(True, alpha=0.25)
    st.pyplot(fig)
    plt.close(fig)

with right:
    st.subheader("7. 테스트 데이터 예측 결과")
    comparison = pd.DataFrame({"실제값": ev["actual"], "예측값": ev["pred"]})
    comparison["오차(실제-예측)"] = comparison["실제값"] - comparison["예측값"]
    st.dataframe(comparison, use_container_width=True, height=300)
    st.download_button(
        "예측 결과 CSV 다운로드",
        comparison.to_csv(index=False).encode("utf-8-sig"),
        file_name="prediction_results.csv",
        mime="text/csv"
    )

st.subheader("8. 새 데이터 예측")
st.write("각 독립변수에 새 값을 입력하면 학습된 모델로 예측합니다.")
with st.form("prediction_form"):
    cols = st.columns(min(len(features), 3))
    new_values = {}
    for i, feature in enumerate(features):
        with cols[i % len(cols)]:
            # 기본값은 각 열의 중앙값
            new_values[feature] = st.number_input(
                feature, value=float(data[feature].median()), format="%.6g", key=f"new_{feature}"
            )
    submitted = st.form_submit_button("예측하기", type="primary")
if submitted:
    new_df = pd.DataFrame([new_values], columns=features)
    result = float(model.predict(new_df)[0])
    st.success(f"예측 {target}: **{result:,.6g}**")
    st.dataframe(new_df, use_container_width=True)

st.subheader("9. 모델 다운로드")
model_buffer = io.BytesIO()
joblib.dump({"model": model, "features": features, "target": target}, model_buffer)
st.download_button(
    "학습된 모델 다운로드 (.joblib)",
    data=model_buffer.getvalue(),
    file_name="linear_regression_model.joblib",
    mime="application/octet-stream"
)

with st.expander("해석 및 주의사항"):
    st.markdown("""
- 이 앱은 **숫자형 변수에 대한 기본 선형회귀**를 사용합니다.
- 현재 성능 평가는 무작위 학습/테스트 분할을 이용합니다. 시간 순서가 중요한 데이터는 시간 기반 검증이 필요합니다.
- 결측값과 무한대가 포함된 행은 분석에서 제외됩니다.
- 상관관계가 인과관계를 의미하지는 않습니다.
- 학습 데이터 범위를 크게 벗어난 값을 예측하면 신뢰도가 낮을 수 있습니다.
- 실제 활용 전에는 데이터 품질, 누수 변수, 이상치, 독립변수 간 다중공선성 등을 점검하세요.
""")
