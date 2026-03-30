
#function
# session store (module-level state)
_sessions = {}

def create_session(token: str, user_id: int):
    _sessions[token] = {"user_id": user_id}
    return True


#function
# feature flags (module-level config)
_feature_flags = {
    "beta": False
}

def is_feature_enabled(flag: str) -> bool:
    return _feature_flags.get(flag, False)




#function
# in-memory cache
_cache = {}

def get_cached_value(key: str):
    return _cache.get(key)




#function
# rate limiter using module state
_rate_limit = {}

def is_rate_limited(user_id: str, limit: int):
    count = _rate_limit.get(user_id, 0)

    if count >= limit:
        return True

    _rate_limit[user_id] = count + 1
    return False


