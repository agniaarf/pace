<?php

return [
    // Whether a kasir must have an open shift before creating a transaction.
    // Kept as a soft rollout toggle so shift enforcement can be disabled without a code change.
    'require_shift' => env('REQUIRE_SHIFT', true),
];
