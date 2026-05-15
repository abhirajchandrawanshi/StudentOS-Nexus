from fastapi import FastAPI

app=FastAPI()

@app.get("/")
def homme():
    return {"message":"first api created succesfully"}