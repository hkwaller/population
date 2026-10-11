'use client'

import { PopHeader, PopAuth } from './pop/PopHeader'

export const Logo = () => <PopHeader logoTone="ink" right={<PopAuth tone="dark" />} />
