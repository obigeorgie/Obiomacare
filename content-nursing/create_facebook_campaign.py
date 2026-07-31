#!/usr/bin/env python3
"""
Obioma Care — NCLEX Clinical Judgment Facebook Ad Campaign (Simplified)
"""
import os
import json
import requests
from datetime import datetime, timedelta

ACCESS_TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN", "EAAcY9Q9edZB0BSPPZCRnZAYNBtzeMyZBnBqAwWmSnwbY7Y4O0bekQCPyGxiDGYMJVlg51do1OgNVXDUmz6nuHybgLiBGbN99GyD61ZCLXf1YYIVKsmFOXYppMxTGCP8Q3foxQReclZCukyDHPSvBZAUrxWJzviVgCrsKWNuu3OAmhqntf7cy8xe2VFh4HnWhEtzCd8utvZC50PfaAAiqE80ZD")
AD_ACCOUNT_ID = "823605304813059"
PIXEL_ID = "1045171501242922"
PAGE_ID = "1079007251973792"
API_VERSION = "v18.0"
BASE_URL = f"https://graph.facebook.com/{API_VERSION}"

def fb_api(endpoint, method="GET", params=None, data=None):
    url = f"{BASE_URL}{endpoint}"
    all_params = {"access_token": ACCESS_TOKEN}
    if params:
        all_params.update(params)
    if method == "GET":
        resp = requests.get(url, params=all_params, timeout=30)
    else:
        resp = requests.post(url, params=all_params, data=data, timeout=30)
    return resp.json()

# Delete old campaign first
def delete_campaign(campaign_id):
    fb_api(f"/{campaign_id}", "POST", data={"status": "DELETED"})

# Create campaign
def create_campaign():
    data = {
        "name": f"NCLEX Clinical Judgment — {datetime.now().strftime('%Y-%m-%d')}",
        "objective": "OUTCOME_SALES",
        "is_adset_budget_sharing_enabled": "False",
        "status": "PAUSED",
        "special_ad_categories": "[]",
        "buying_type": "AUCTION"
    }
    return fb_api(f"/act_{AD_ACCOUNT_ID}/campaigns", "POST", data=data)

# Create ad set with simple targeting
def create_ad_set(campaign_id, name, budget, age_min, age_max, interest_ids):
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    interests = [{"id": iid} for iid in interest_ids]
    
    targeting = {
        "geo_locations": {
            "countries": ["US"],
            "location_types": ["home", "recent"]
        },
        "age_min": age_min,
        "age_max": age_max,
        "genders": [1, 2],
        "interests": interests,
        "targeting_automation": {
            "advantage_audience": 0
        }
    }
    
    data = {
        "name": name,
        "campaign_id": campaign_id,
        "daily_budget": str(int(budget * 100)),
        "billing_event": "IMPRESSIONS",
        "optimization_goal": "OFFSITE_CONVERSIONS",
        "attribution_spec": '[{"event_type":"CLICK_THROUGH","window_days":7}]',
        "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
        "targeting": json.dumps(targeting),
        "promoted_object": json.dumps({
            "pixel_id": PIXEL_ID,
            "custom_event_type": "PURCHASE"
        }),
        "status": "PAUSED",
        "start_time": f"{tomorrow}T08:00:00-0500"
    }
    return fb_api(f"/act_{AD_ACCOUNT_ID}/adsets", "POST", data=data)

def create_ad(ad_set_id, name, headline, body):
    creative_data = {
        "name": f"Creative — {name}",
        "object_story_spec": json.dumps({
            "page_id": PAGE_ID,
            "link_data": {
                "message": body,
                "link": "https://obiomacare.com",
                "name": headline,
                "description": "Pass the NGN NCLEX with clinical judgment frameworks",
                "call_to_action": {"type": "SHOP_NOW"}
            }
        })
    }
    
    creative_result = fb_api(f"/act_{AD_ACCOUNT_ID}/adcreatives", "POST", data=creative_data)
    if "error" in creative_result:
        print(f"  ⚠️ Creative failed: {creative_result['error']}")
        return None
    
    creative_id = creative_result.get("id")
    
    ad_data = {
        "name": name,
        "adset_id": ad_set_id,
        "creative": json.dumps({"creative_id": creative_id}),
        "status": "PAUSED",
        "tracking_specs": json.dumps([{
            "action.type": ["offsite_conversion"],
            "fb_pixel": [PIXEL_ID]
        }])
    }
    return fb_api(f"/act_{AD_ACCOUNT_ID}/ads", "POST", data=ad_data)

if __name__ == "__main__":
    print("🚀 Creating NCLEX Clinical Judgment Campaign...")
    
    campaign = create_campaign()
    if "error" in campaign:
        print(f"❌ Campaign failed: {campaign['error']}")
        exit(1)
    
    campaign_id = campaign["id"]
    print(f"✅ Campaign: {campaign_id}")
    
    # Verified interest IDs from API search
    NURSE_EDUCATION = "6003239593388"
    TEST_PREP = "6004055349148"
    
    ad_sets = [
        ("Nursing Students — NCLEX Prep", 20, 20, 35, [NURSE_EDUCATION, TEST_PREP]),
        ("Nursing School — 18-30", 15, 18, 30, [NURSE_EDUCATION, TEST_PREP]),
    ]
    
    ad_set_ids = []
    for name, budget, age_min, age_max, interest_ids in ad_sets:
        print(f"\n📌 Creating ad set: {name}...")
        result = create_ad_set(campaign_id, name, budget, age_min, age_max, interest_ids)
        if "error" in result:
            print(f"  ⚠️ Failed: {result['error']}")
        else:
            ad_set_id = result["id"]
            print(f"  ✅ Ad Set: {ad_set_id}")
            ad_set_ids.append((ad_set_id, name))
    
    ad_variants = [
        {
            "headline": "Pass the NGN NCLEX on Your First Try",
            "body": "🩺 The new NCLEX tests clinical judgment — not memorization.\n\n30+ real scenarios. Video walkthroughs. Decision trees.\n\nBuilt by a 15-year ER nurse.\n\n$47. 30-day guarantee.\n\n👉 obiomacare.com"
        },
        {
            "headline": "Stop Memorizing. Start Thinking Like a Nurse.",
            "body": "The NGN NCLEX doesn't care how many flashcards you memorized.\n\nIt cares if you can recognize a crashing patient and act in the right order.\n\nThat's clinical judgment. That's what we teach.\n\n✅ 30+ scenarios\n✅ Video walkthroughs\n✅ Prioritization frameworks\n\n$47 → obiomacare.com"
        },
    ]
    
    for ad_set_id, ad_set_name in ad_set_ids:
        for i, variant in enumerate(ad_variants):
            ad_name = f"{ad_set_name} — Ad {i+1}"
            print(f"\n📝 Creating ad: {ad_name}...")
            result = create_ad(ad_set_id, ad_name, variant["headline"], variant["body"])
            if result and "error" in result:
                print(f"  ⚠️ Failed: {result['error']}")
            elif result:
                print(f"  ✅ Ad: {result.get('id')}")
    
    print(f"\n🎉 Campaign created!")
    print(f"Campaign ID: {campaign_id}")
    print(f"Status: PAUSED (review in Ads Manager before activating)")
    print(f"https://business.facebook.com/adsmanager/manage/campaigns?act={AD_ACCOUNT_ID}")
