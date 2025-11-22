import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os
from dotenv import load_dotenv

# Cargar variables del archivo .env
load_dotenv() 

print("🔄 Conectando con Firebase...")

# Configuramos las credenciales leyendo del .env
try:
    private_key = os.getenv("FIREBASE_PRIVATE_KEY")
    if private_key:
        # Reemplazamos los saltos de línea literales si vienen escapados
        private_key = private_key.replace('\\n', '\n')

    cred_dict = {
        "type": "service_account",
        "project_id": os.getenv("FIREBASE_PROJECT_ID"),
        "private_key_id": "tu_id_privado_opcional", 
        "private_key": private_key,
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
        "token_uri": "https://oauth2.googleapis.com/token",
    }

    cred = credentials.Certificate(cred_dict)
    try:
        app = firebase_admin.get_app()
    except ValueError:
        app = firebase_admin.initialize_app(cred)
        
    db = firestore.client()
    print("✅ Conexión exitosa.")

except Exception as e:
    print(f"❌ Error de conexión: {e}")
    print("Revisa que tu archivo .env tenga la FIREBASE_PRIVATE_KEY correcta.")
    exit()

def delete_collection(coll_ref, batch_size):
    docs = coll_ref.limit(batch_size).stream()
    deleted = 0
    for doc in docs:
        doc.reference.delete()
        deleted = deleted + 1
    if deleted >= batch_size:
        return delete_collection(coll_ref, batch_size)

def populate_database():
    print("⚠️  Limpiando base de datos antigua...")
    delete_collection(db.collection("categories"), 10)
    delete_collection(db.collection("products"), 10)
    
    # DATOS DE JUGUETES NAVIDEÑOS
    data_structure = [
        {
            "category_name": "Muñecas y Peluches",
            "slug": "munecas-peluches",
            "icon": "🧸",
            "image": "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80",
            "products": [
                {
                    "name": "Oso Gigante Navideño",
                    "slug": "oso-gigante",
                    "price": 120.00,
                    "stock": 20,
                    "description": "Oso de peluche de 1.5 metros ultra suave.",
                    "image": "https://images.unsplash.com/photo-1556012018-50c9495d56bb?auto=format&fit=crop&w=800&q=80",
                    "details": { "material": "Algodón", "altura": "150cm" }
                },
                {
                    "name": "Muñeca Princesa Mágica",
                    "slug": "muneca-princesa",
                    "price": 89.90,
                    "stock": 15,
                    "description": "Muñeca articulada con vestido brillante.",
                    "image": "https://images.unsplash.com/photo-1536582368227-0732f195525e?auto=format&fit=crop&w=800&q=80",
                    "details": { "incluye": "Varita", "edad": "3+" }
                }
            ]
        },
        {
            "category_name": "Carros y Pistas",
            "slug": "carros-pistas",
            "icon": "🏎️",
            "image": "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80",
            "products": [
                {
                    "name": "Auto RC 4x4",
                    "slug": "auto-rc-4x4",
                    "price": 150.00,
                    "stock": 10,
                    "description": "Todo terreno, recargable y veloz.",
                    "image": "https://images.unsplash.com/photo-1532330384815-c1648102b7d4?auto=format&fit=crop&w=800&q=80",
                    "details": { "bateria": "USB", "alcance": "50m" }
                }
            ]
        }
    ]

    print("🚀 Subiendo datos...")
    for cat_data in data_structure:
        cat_ref = db.collection("categories").document()
        cat_payload = {
            "name": cat_data["category_name"],
            "slug": cat_data["slug"],
            "imageUrl": cat_data["image"],
            "icon": cat_data.get("icon", "🎁"),
            "createdAt": firestore.SERVER_TIMESTAMP
        }
        cat_ref.set(cat_payload)
        print(f" 📂 {cat_data['category_name']}")

        for prod in cat_data["products"]:
            prod_ref = db.collection("products").document()
            prod_payload = {
                "categoryId": cat_ref.id,
                "categorySlug": cat_data["slug"],
                "name": prod["name"],
                "slug": prod["slug"],
                "price": prod["price"],
                "stock": prod["stock"],
                "description": prod["description"],
                "imageUrl": prod["image"],
                "specifications": prod["details"],
                "createdAt": firestore.SERVER_TIMESTAMP
            }
            prod_ref.set(prod_payload)
    
    print("\n✨ ¡Base de datos actualizada!")

if __name__ == "__main__":
    populate_database()