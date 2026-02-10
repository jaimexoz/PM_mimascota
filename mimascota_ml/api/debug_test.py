"""
Test directo de la API Flask para debugear el error
"""

import requests
import json

API_URL = "http://localhost:5001"

# Payload de prueba (perfil de Golden Retriever)
payload = {
    "user_id": 5,
    "user_profile": {
        "horasEnCasa": "6_8",
        "nivelActividad": "activo",
        "experienciaMascotas": "moderada",
        "tipoVivienda": "casa_jardin",
        "tamanoMascota": "grande",
        "edadPreferida": "joven",
        "perroOGato": "solo_perros",
        "nivelEnergia": "energetico",
        "personalidad": "amigable,jugueton,cariñoso",
        "ninosEnCasa": "no",
        "otrasMascotas": "no",
        "tiempoCuidado": "mas_2",
        "entrenamiento": "si",
        "presupuesto": "alto"
    },
    "n_recommendations": 10
}

print("🧪 Testing Python ML API...")
print(f"URL: {API_URL}/api/ml/recommend")
print(f"Payload: {json.dumps(payload, indent=2)}")
print("\n" + "="*60 + "\n")

try:
    response = requests.post(
        f"{API_URL}/api/ml/recommend",
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    print(f"✅ Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Response Status: {data.get('status')}")
        print(f"✅ Recommendations: {data.get('count')}")
        
        if data.get('recommendations'):
            print("\nFirst recommendation:")
            rec = data['recommendations'][0]
            print(f"  Pet ID: {rec.get('pet_id')}")
            print(f"  Match %: {rec.get('match_percentage')}%")
            print(f"  Hybrid Score: {rec.get('hybrid_score'):.3f}")
    else:
        print(f"❌ Error Response:")
        print(response.text)
        
except requests.exceptions.ConnectionError:
    print("❌ ERROR: No se puede conectar a la API de Python")
    print("   Asegúrate de que 'python api\\app.py' esté corriendo")
    
except requests.exceptions.Timeout:
    print("❌ ERROR: Timeout - la API tardó más de 10 segundos")
    
except Exception as e:
    print(f"❌ ERROR: {type(e).__name__}: {str(e)}")
