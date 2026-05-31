Для запуска надо в терминале выполнить последовательно 

на маке / ликунсе
source venv/bin/activate
на винде 
venv\Scripts\activate

Потом (при первом запуске)
pip install -r requirements.txt


Дальше
uvicorn main:app --reload
или
python -m uvicorn main:app --reload


Дальше сайт открывается по адресу 
http://127.0.0.1:8000