"""
SeniorShield WhatsApp Sentinel powered by Neonize
Real-Time WhatsApp Multi-Device Scam Analyzer & Guardian Alert Engine
"""

import os
import sys
import time
import json
import logging
import threading
from typing import Optional
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

import google.generativeai as genai
from neonize.client import NewClient
from neonize.events import (
    ConnectedEv,
    MessageEv,
    PairStatusEv,
    ReceiptEv,
    CallOfferEv,
    event,
)
from neonize.types import MessageWithContextInfo
from neonize.utils import log

# Configure Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("WhatsAppSentinel")

# Load environment variables
load_dotenv("/home/luckycelestial/Pavithran/CIT hackathon/.env")
GEMINI_API_KEY = os.getenv("EXPO_PUBLIC_GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Flask API for SeniorShield App Integration
app = Flask(__name__)
CORS(app)

# Global State
whatsapp_state = {
    "is_connected": False,
    "pairing_qr": None,
    "scanned_messages_count": 0,
    "threats_detected": [],
    "last_analyzed": None,
}

DB_PATH = "/home/luckycelestial/Pavithran/CIT hackathon/whatsapp_service/whatsapp_session.db"

def analyze_whatsapp_message_with_gemini(sender_jid: str, message_text: str, has_media: bool = False, media_type: str = "") -> dict:
    """
    Sends WhatsApp message content to Gemini 3.5 Flash Lite for deep social-engineering analysis.
    """
    if not GEMINI_API_KEY or not message_text.strip():
        # Fallback heuristic analysis
        is_scam = any(w in message_text.lower() for w in ["cbi", "police", "arrest", "narcotics", "customs", "electricity", "apk", "otp", "win", "lottery", "urgent"])
        return {
            "threat_level": "CRITICAL" if is_scam else "SAFE",
            "scam_type": "WhatsApp Extortion / Coercion Threat" if is_scam else "Benign Message",
            "confidence_score": 0.95 if is_scam else 0.05,
            "plain_english_explanation": "This message is attempting fear-based extortion or credential theft via WhatsApp." if is_scam else "Normal conversational message.",
            "senior_action_directive": "DO NOT REPLY! Block this number and do not join any video call." if is_scam else "No action needed.",
        }

    try:
        model = genai.GenerativeModel("gemini-2.5-flash-lite")
        prompt = f"""
You are SeniorShield's WhatsApp Scam Sentinel. Analyze this incoming WhatsApp message sent to a senior citizen in India.
Sender JID/Number: {sender_jid}
Message Text: {message_text}
Has Media/Attachment: {has_media} (Type: {media_type})

Evaluate if this is a scam (e.g. Digital Arrest / Fake Police video call, Electricity bill cut-off, Fake APK download, Bank KYC fraud, Job/Lottery scam).

Return ONLY valid JSON matching this exact structure:
{{
  "threat_level": "CRITICAL" | "SUSPICIOUS" | "SAFE",
  "scam_type": "string describing specific scam or 'None'",
  "confidence_score": float between 0.0 and 1.0,
  "plain_english_explanation": "Simple 1-2 sentence explanation tailored for an elderly person",
  "senior_action_directive": "Clear, direct instruction (e.g. 'DO NOT ANSWER! Do not join the video call.')"
}}
"""
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        logger.error(f"Gemini WhatsApp analysis error: {e}")
        return {
            "threat_level": "SUSPICIOUS",
            "scam_type": "Unverified Message",
            "confidence_score": 0.6,
            "plain_english_explanation": "Unable to verify safety. Exercise caution.",
            "senior_action_directive": "Do not share OTPs or passwords.",
        }

# Initialize Neonize Client
client = NewClient(DB_PATH)

@client.event(ConnectedEv)
def on_connected(client: NewClient, event: ConnectedEv):
    logger.info("🟢 WhatsApp Neonize Client CONNECTED successfully!")
    whatsapp_state["is_connected"] = True
    whatsapp_state["pairing_qr"] = None

@client.event(PairStatusEv)
def on_pair_status(client: NewClient, event: PairStatusEv):
    logger.info(f"📱 WhatsApp Pairing Status: {event}")

@client.event(CallOfferEv)
def on_call_offer(client: NewClient, event: CallOfferEv):
    caller_jid = str(event.CallCreator)
    logger.warning(f"📞 Incoming WhatsApp Call from: {caller_jid}")
    # Digital arrest scams heavily rely on WhatsApp video/voice calls
    threat_entry = {
        "id": f"call_{int(time.time())}",
        "timestamp": int(time.time() * 1000),
        "sender": caller_jid,
        "type": "WHATSAPP_CALL",
        "threat_level": "SUSPICIOUS",
        "scam_type": "Incoming WhatsApp Video/Voice Call from Unknown Number",
        "plain_english_explanation": "A stranger is calling you on WhatsApp. Scammers often pretend to be Police/CBI on video calls.",
        "senior_action_directive": "DO NOT ACCEPT video calls from unknown people. Police never call on WhatsApp.",
    }
    whatsapp_state["threats_detected"].insert(0, threat_entry)

@client.event(MessageEv)
def on_message(client: NewClient, message: MessageEv):
    try:
        sender = str(message.Info.Sender)
        chat = str(message.Info.Chat)
        is_from_me = message.Info.IsFromMe
        
        if is_from_me:
            return

        # Extract text message content
        text_content = ""
        msg = message.Message
        if msg.conversation:
            text_content = msg.conversation
        elif msg.extendedTextMessage and msg.extendedTextMessage.text:
            text_content = msg.extendedTextMessage.text
        elif msg.imageMessage and msg.imageMessage.caption:
            text_content = f"[IMAGE] {msg.imageMessage.caption}"
        elif msg.documentMessage:
            filename = msg.documentMessage.fileName or "document"
            text_content = f"[DOCUMENT/APK] {filename}"
        
        if not text_content:
            return

        whatsapp_state["scanned_messages_count"] += 1
        logger.info(f"📩 New WhatsApp message from {sender}: {text_content[:60]}...")

        # Analyze with AI
        analysis = analyze_whatsapp_message_with_gemini(sender, text_content)
        
        if analysis.get("threat_level") in ["CRITICAL", "SUSPICIOUS"]:
            logger.warning(f"🚨 SCAM DETECTED ON WHATSAPP: {analysis['scam_type']}")
            threat_record = {
                "id": f"wa_{int(time.time())}",
                "timestamp": int(time.time() * 1000),
                "sender": sender,
                "message_preview": text_content,
                "type": "WHATSAPP_MESSAGE",
                **analysis
            }
            whatsapp_state["threats_detected"].insert(0, threat_record)
            whatsapp_state["last_analyzed"] = threat_record

    except Exception as e:
        logger.error(f"Error processing WhatsApp message event: {e}")

# REST Endpoints for SeniorShield App
@app.route("/api/whatsapp/status", methods=["GET"])
def get_status():
    return jsonify({
        "connected": whatsapp_state["is_connected"],
        "scanned_count": whatsapp_state["scanned_messages_count"],
        "threats_count": len(whatsapp_state["threats_detected"]),
        "latest_threat": whatsapp_state["threats_detected"][0] if whatsapp_state["threats_detected"] else None,
    })

@app.route("/api/whatsapp/threats", methods=["GET"])
def get_threats():
    return jsonify(whatsapp_state["threats_detected"])

@app.route("/api/whatsapp/simulate", methods=["POST"])
def simulate_whatsapp_threat():
    data = request.json or {}
    sample_text = data.get("text", "CBI Cyber Cell: An FIR #9921 is lodged against your Aadhaar. Join WhatsApp video call immediately.")
    sender = data.get("sender", "+91 99887 76655")
    
    analysis = analyze_whatsapp_message_with_gemini(sender, sample_text)
    record = {
        "id": f"sim_wa_{int(time.time())}",
        "timestamp": int(time.time() * 1000),
        "sender": sender,
        "message_preview": sample_text,
        "type": "WHATSAPP_MESSAGE",
        **analysis
    }
    whatsapp_state["threats_detected"].insert(0, record)
    whatsapp_state["scanned_messages_count"] += 1
    return jsonify({"success": True, "record": record})

def start_flask():
    app.run(host="0.0.0.0", port=5005, debug=False, use_reloader=False)

def run_neonize():
    logger.info("🚀 Connecting SeniorShield Neonize WhatsApp Sentinel...")
    client.connect()

if __name__ == "__main__":
    flask_thread = threading.Thread(target=start_flask, daemon=True)
    flask_thread.start()
    logger.info("📡 SeniorShield WhatsApp REST API running on http://0.0.0.0:5005")
    
    try:
        run_neonize()
    except KeyboardInterrupt:
        logger.info("Stopping WhatsApp Sentinel...")
        client.disconnect()
