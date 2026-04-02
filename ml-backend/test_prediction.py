import requests
try:
    res = requests.post("http://localhost:8000/predict/heart", json={"age":55,"sex":1,"cp":0,"trestbps":130,"chol":240,"fbs":0,"restecg":0,"thalach":150,"exang":0,"oldpeak":1.5,"slope":0,"ca":0,"thal":0})
    with open("out.txt", "w") as f:
        f.write(f"{res.status_code} {res.text}")
except Exception as e:
    with open("out.txt", "w") as f:
        f.write(str(e))
