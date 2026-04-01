
from urllib import response
import pandas as pd
from django.shortcuts import render
import calendar
from datetime import date, datetime, timedelta
import requests
from . import valtozok
from django.http import JsonResponse, HttpResponse
import json

def _parse_ev_honap(request):
    today = datetime.today()
    ev = request.GET.get('ev', today.year)
    honap = request.GET.get('honap', today.month)

    try:
        ev = int(ev)
    except (TypeError, ValueError):
        ev = today.year

    try:
        honap = int(honap)
    except (TypeError, ValueError):
        honap = today.month

    if honap < 1 or honap > 12:
        honap = today.month

    return ev, honap

def _elozo_kovetkezo_honap(ev, honap):
    elozo_honap = honap - 1
    elozo_ev = ev
    if elozo_honap == 0:
        elozo_honap = 12
        elozo_ev -= 1

    kovetkezo_honap = honap + 1
    kovetkezo_ev = ev
    if kovetkezo_honap == 13:
        kovetkezo_honap = 1
        kovetkezo_ev += 1

    return elozo_ev, elozo_honap, kovetkezo_ev, kovetkezo_honap

def jelenleti(request):
    global rendezett_adatok
    global jeleleti_json
    ev, honap = _parse_ev_honap(request)
    elozo_ev, elozo_honap, kovetkezo_ev, kovetkezo_honap = _elozo_kovetkezo_honap(ev, honap)

    url = "https://bonitago.hu/jelenleti_uj.php"   
    data = {
       'ev': ev,
       'honap': honap,
    }
    jeleleti_json = requests.post(url, data=data)
   
    context = {}

    if jeleleti_json.status_code == 200:
        jelenleti_df = pd.DataFrame() # üres dataframe létrehozása, hogy ne legyen hiba, ha nincs adat
        adatok = jeleleti_json.json()
        if adatok:
            print("Van adat")
            jelenleti_df = jelenleti_adatok(jeleleti_json) # egy hónap jelenleti adatai dataframe-ben
            context = html_adatok(jelenleti_df, data)
        else:
            print("Nincs adat")
        
        
        context['elozo_ev'] = elozo_ev
        context['elozo_honap'] = elozo_honap
        context['kovetkezo_ev'] = kovetkezo_ev
        context['kovetkezo_honap'] = kovetkezo_honap
        
    else:
        print('Hiba:', jeleleti_json.text)
    valasz = render(request, 'bonitadashboardapp/jelenleti.html', context)

    rendezett_adatok = []
    print(valasz)
    return valasz

def jelenleti_adatok(response):
    
    json_str = response.json()
    json_dt = pd.DataFrame(json_str)
    json_dt['erkezes'] = pd.to_timedelta(json_dt['erkezes'].astype(str))
    json_dt['tavozas'] = pd.to_timedelta(json_dt['tavozas'].astype(str))
    json_dt['diff'] = json_dt['tavozas'] - json_dt['erkezes']

    # Idő formázása órákra és percekre, ha a diff érték pozitív, egyébként üres string -> 0:00
    def format_duration(td):
        if pd.isnull(td) or td.total_seconds() <= 0:
            return ""
        total_seconds = int(td.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        return f"{hours}:{minutes:02d}"
    
    json_dt['work_time'] = json_dt['diff'].apply(format_duration)
    
    json_dt = (
        json_dt.groupby(['id', 'dolgozonev', 'oraber', 'napiber', 'honapnevsorID'])
        .apply(lambda x: x[['work_time', 'nap', 'erkezes', 'tavozas', 'megjegyzes', 'ev', 'honap']]
               .to_dict('records'))
        .reset_index()
        .rename(columns={0: 'napok'}))

    return json_dt

def html_adatok(jelenleti_df, data):
    global rendezett_adatok
    napok_magyar = valtozok.napok_magyar
    honapok_magyar = valtozok.honapok_magyar
    napok_szama = calendar.monthrange(data['ev'], data['honap'])[1] # Napok száma a hónapban

    # Lista 1-től napok_szama-ig
    napok = list(range(1, napok_szama + 1))
        
    nap_nevek = []
    for nap in napok:
        datum = datetime(data['ev'], data['honap'], nap)
        nap_nevek.append(napok_magyar[datum.strftime('%a')]) # 'Mon', 'Tue' stb. (vagy magyarítás)

    tabla_adat = {}
    dolgozok = jelenleti_df[['id', 'dolgozonev', 'oraber', 'napiber', 'honapnevsorID']] # dolgozók egyedi listája
    tabla = []
    tablaErkezesTavozas = []
    for index, sor in dolgozok.iterrows():
        dolgozo_sor = {}
        erkezes_tavozas = {}
        for nap in napok:
            dolgokra_bontva = jelenleti_df[(jelenleti_df['id'] == sor['id'])] # dolgozóra szűrt adatok, ahol minden nap külön sorban van
            dolgokra_bontva_df = pd.DataFrame(dolgokra_bontva['napok'].values[0]) # dolgozóra szűrt adatok dataframe-ben, ahol minden nap külön sorban van
            szurt_adat = dolgokra_bontva_df[dolgokra_bontva_df['nap'] == nap] # napra szűrt
            if not szurt_adat.empty:
                dolgozo_sor[nap] = szurt_adat.iloc[0]['work_time']
                erkezes_tavozas[str(nap) + 'e'] = timeToString(szurt_adat.iloc[0]['erkezes'])
                erkezes_tavozas[str(nap) + 't'] = timeToString(szurt_adat.iloc[0]['tavozas'])
            else:
                dolgozo_sor[nap] = ""
              
        idopontoksor = {'id': sor['id'],
                 'oraber': sor['oraber'],
                 'napiber': sor['napiber'],
                 'honapnevsorID': sor['honapnevsorID'],
                 'napok': erkezes_tavozas
                 }

        ujsor = {'id': sor['id'],
                 'nev': sor['dolgozonev'],
                 'napok': dolgozo_sor
                 }
        
        tabla.append(ujsor)
        tablaErkezesTavozas.append(idopontoksor)
        

    rendezett_adatok = sorted(tabla, key=lambda x: x['nev'])

    
    return_adat = {
    'ev': data['ev'],
    'honap_szam': data['honap'],
    'honap':honapok_magyar[data['honap'] - 1],
    'napok': napok,
    'nap_nevek': nap_nevek,
    'tabla_adat': rendezett_adatok,
    'tablaErkezesTavozas': tablaErkezesTavozas
    }

    
    return return_adat
    
def timeToString(ido):
    td = ido
    result = f"{td.components.hours:02d}:{td.components.minutes:02d}"
    return result

# JS-ből json adatok feldolgozása - Érkezés és távozás modal mentés után
def adat_mentese(request):
    
    if request.method == 'POST':
        try:
            # A JS-ből küldött JSON beolvasása
            data = json.loads(request.body)
            
            honapnevsor_id = data.get('honapnevsorID')
            nap = data.get('nap')
            erkezes = data.get('erkezes')
            tavozas = data.get('tavozas')
            oraber = data.get('oraber')
            napiber = data.get('napiber')
            ev = data.get('ev')
            honap = data.get('honap')


            if not all([honapnevsor_id, nap, ev, honap]):
                return JsonResponse({'status': 'error', 'message': 'Hiányzó év/hónap/nap vagy azonosító adat.'}, status=400)

            datum = f"{int(ev):04d}-{int(honap):02d}-{int(nap):02d}"
            url = 'http://bonitago.hu/munkaido_ment.php'
            data = {
                'id': honapnevsor_id,
                'datum': datum,
                'nap': nap,
                'erkezes': erkezes,
                'tavozas': tavozas,
                'oraber': oraber,
                'napiber': napiber,
            }
            
            print('Küldött adatok:', data)  # Debug: ellenőrizze a küldött adatokat

            response = requests.post(url, data=data, timeout=20)
            response.raise_for_status()
            print('Sikeres mentés:', response.text)

            return JsonResponse({'status': 'ok', 'message': 'Adat mentve!'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
            
    return JsonResponse({'status': 'invalid method'}, status=405)



def exprotot(request):

    def ido_konvertalas(ido_str):
        if not ido_str or ':' not in ido_str:
            return None  # Vagy 0.0, ha számolni akarsz vele
        
        ora, perc = map(int, ido_str.split(':'))
        return round(ora + (perc / 60), 2)

    ev, honap = _parse_ev_honap(request)
    url = "https://bonitago.hu/jelenleti_uj.php"
    data = {
        'ev': ev,
        'honap': honap,
    }

    jelenleti_response = requests.post(url, data=data)
    if jelenleti_response.status_code != 200:
        return JsonResponse({'status': 'error', 'message': 'Nem sikerült lekérni a jelenléti adatokat.'}, status=502)

    jelenleti_df = jelenleti_adatok(jelenleti_response)
    context = html_adatok(jelenleti_df, data)
    rendezett_adatok = context['tabla_adat']

   
    NAPOK_NEVEI = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"]

    # 1. Speciális sorok generálása (Dátum és Nap név)
    datum_sor = {"nev": "Dátum"}
    nap_nev_sor = {"nev": "Nap"}

    for i in range(1, 32):
        try:
            current_date = date(ev, honap, i)
            datum_sor[i] = current_date.strftime("%Y.%m.%d")
            nap_nev_sor[i] = NAPOK_NEVEI[current_date.weekday()]
        except ValueError:
            # Ha a hónap nem 31 napos (pl. február), üresen hagyjuk a végét
            datum_sor[i] = ""
            nap_nev_sor[i] = ""

    # 2. Személyek adatainak feldolgozása
    lista = [datum_sor, nap_nev_sor] # A két fejléc sor kerül az elejére

    for szemely in rendezett_adatok:
        sor = {'nev': szemely['nev']}
        konvertalt_napok = {nap: ido_konvertalas(ido) for nap, ido in szemely['napok'].items()}
        sor.update(konvertalt_napok)
        lista.append(sor)
    
    

    # --- EXCEL LÉTREHOZÁSA ---
    df = pd.DataFrame(lista)

    # Oszlopok sorrendjének beállítása (Név, majd 1, 2, 3...)
    cols = ['nev'] + list(range(1, 32))
    df = df[cols]
    
    output_path = '/Users/futurex/Desktop/jelenleti.xlsx'
    with pd.ExcelWriter(output_path, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='Jelenleti', index=False, header=["Név"] + list(range(1, 32)))
        worksheet = writer.sheets['Jelenleti']
        center_format = writer.book.add_format({'align': 'center'})
        worksheet.set_column('A:A', 20)
        worksheet.set_column('B:AF', 10, center_format)

    
    return HttpResponse(status=204)