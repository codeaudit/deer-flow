"""
Billing functionality for deer-flow using Stripe
"""

import os
import json
import stripe
from typing import Dict, Optional, Any, cast
from datetime import datetime
from src.auth.database import get_supabase_client

# Initialize Stripe with secret key
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")  # Default to empty string

# Price IDs for different tiers
PRICE_IDS = {
    "free": os.getenv("STRIPE_PRICE_FREE", ""),
    "plus": os.getenv("STRIPE_PRICE_PLUS", ""),
    "pro": os.getenv("STRIPE_PRICE_PRO", ""),
    "ultra": os.getenv("STRIPE_PRICE_ULTRA", ""),
}


class BillingService:
    @staticmethod
    async def create_checkout_session(user_email: str, price_id: str) -> Dict[str, Any]:
        """Create a Stripe checkout session for subscription."""
        try:
            session = stripe.checkout.Session.create(
                customer_email=user_email,
                line_items=[{"price": price_id, "quantity": 1}],
                mode="subscription",
                success_url="http://localhost:3000/settings?success=true",
                cancel_url="http://localhost:3000/settings?canceled=true",
            )
            return {"sessionId": session.id}
        except Exception as e:
            raise Exception(f"Error creating checkout session: {str(e)}")

    @staticmethod
    async def create_billing_portal_session(customer_id: str) -> Dict[str, str]:
        """Create a Stripe billing portal session."""
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url="http://localhost:3000/settings",
            )
            return {"url": session.url}
        except Exception as e:
            raise Exception(f"Error creating portal session: {str(e)}")

    @staticmethod
    async def handle_webhook_event(payload: bytes, sig_header: Optional[str] = None):
        """Handle Stripe webhook events."""
        try:
            # For local development, we don't verify signatures
            event_dict = json.loads(payload)
            event = stripe.Event.construct_from(event_dict, stripe.api_key)

            if event.type == "checkout.session.completed":
                session = event.data.object
                await BillingService.handle_successful_payment(
                    cast(Dict[str, Any], session)
                )
            elif event.type == "customer.subscription.updated":
                subscription = event.data.object
                await BillingService.handle_subscription_updated(
                    cast(Dict[str, Any], subscription)
                )
            elif event.type == "customer.subscription.deleted":
                subscription = event.data.object
                await BillingService.handle_subscription_deleted(
                    cast(Dict[str, Any], subscription)
                )

        except Exception as e:
            raise Exception(f"Error handling webhook: {str(e)}")

    @staticmethod
    async def handle_successful_payment(session: Dict[str, Any]):
        """Handle successful checkout session completion."""
        try:
            client = await get_supabase_client()

            # Get subscription and customer details
            subscription_id = session.get("subscription")
            customer_id = session.get("customer")

            if not subscription_id or not customer_id:
                raise ValueError("Missing subscription or customer ID")

            subscription = stripe.Subscription.retrieve(str(subscription_id))
            customer = stripe.Customer.retrieve(str(customer_id))

            # Update billing_customers table
            customer_data = {
                "id": customer.id,
                "email": customer.email,
                "provider": "stripe",
            }

            # Update billing_subscriptions table
            subscription_data = {
                "id": subscription.id,
                "billing_customer_id": customer.id,
                "status": subscription.status,
                "price_id": subscription.items.data[0].price.id,
                "quantity": subscription.items.data[0].quantity,
                "cancel_at_period_end": subscription.cancel_at_period_end,
                "current_period_start": datetime.fromtimestamp(
                    subscription.current_period_start
                ),
                "current_period_end": datetime.fromtimestamp(
                    subscription.current_period_end
                ),
                "created": datetime.fromtimestamp(subscription.created),
                "metadata": subscription.metadata,
            }

            # Use the service_role_upsert_customer_subscription RPC function
            client_ref_id = session.get("client_reference_id")
            if not client_ref_id:
                raise ValueError("Missing client reference ID")

            await client.rpc(
                "service_role_upsert_customer_subscription",
                {
                    "account_id": client_ref_id,
                    "customer": customer_data,
                    "subscription": subscription_data,
                },
            ).execute()

        except Exception as e:
            raise Exception(f"Error handling successful payment: {str(e)}")

    @staticmethod
    async def handle_subscription_updated(subscription_data: Dict[str, Any]):
        """Handle subscription update events."""
        try:
            client = await get_supabase_client()

            sub_id = subscription_data.get("id")
            if not sub_id:
                raise ValueError("Missing subscription ID")

            subscription = stripe.Subscription.retrieve(str(sub_id))

            subscription_update = {
                "id": subscription.id,
                "status": subscription.status,
                "price_id": subscription.items.data[0].price.id,
                "quantity": subscription.items.data[0].quantity,
                "cancel_at_period_end": subscription.cancel_at_period_end,
                "current_period_start": datetime.fromtimestamp(
                    subscription.current_period_start
                ),
                "current_period_end": datetime.fromtimestamp(
                    subscription.current_period_end
                ),
                "metadata": subscription.metadata,
            }

            # Update subscription in database
            await client.from_("billing_subscriptions").update(subscription_update).eq(
                "id", subscription.id
            ).execute()

        except Exception as e:
            raise Exception(f"Error handling subscription update: {str(e)}")

    @staticmethod
    async def handle_subscription_deleted(subscription_data: Dict[str, Any]):
        """Handle subscription deletion events."""
        try:
            client = await get_supabase_client()

            subscription_id = subscription_data.get("id")
            if not subscription_id:
                raise ValueError("Missing subscription ID")

            # Mark subscription as canceled in database
            await client.from_("billing_subscriptions").update(
                {"status": "canceled", "ended_at": datetime.now()}
            ).eq("id", str(subscription_id)).execute()

        except Exception as e:
            raise Exception(f"Error handling subscription deletion: {str(e)}")
