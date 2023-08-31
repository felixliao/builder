import { fireEvent, render, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'

import '@testing-library/jest-dom'

import { useChat } from 'ai/react'

import Chat from '@/components/chat/page'
import TestChat from '@/app/demo/test-chat/page'

describe('Chat', () => {
  let component: ReturnType<typeof render>
  beforeEach(() => {
    component = render(
      <Chat
        app={{
          name: 'chat-app',
          short_id: 'YhTq4Xx29aDZ',
          icon: '',
          enable_video_interaction: false,
          opening_remarks: null,
        }}
        mode="live"
        session={{
          api_session_id: '21486acbbd393f8a6131a9009d6aae4d',
          short_id: 'srQuAKvgZR7W',
          name: 'test-chat-session',
        }}
      />
    )
  })

  test('test chat show the default UI', () => {
    const { getByPlaceholderText, queryByText, queryByRole } = component
    // chat header, session-name
    expect(queryByText('test-chat-session')).toBeDefined()

    // chat list

    // chat input
    expect(getByPlaceholderText('Type a message')).toBeDefined()
    expect(queryByText('send')).toBeDefined()
    expect(
      queryByRole('button')?.attributes.getNamedItem('disabled')
    ).toBeDefined()
  })

  test('test chat when enter press to send msg', () => {
    // TODO: why multi textarea
    const { getAllByPlaceholderText, queryByText, getByRole } = component
    const textarea = getAllByPlaceholderText('Type a message')
    const input = 'hello, to test the textarea keypress'

    fireEvent.keyPress(textarea?.[0], {
      key: 'Enter',
      code: 13,
      charCode: 13,
      target: { value: input },
    })

    // add a new message
    expect(queryByText(input)).toBeDefined

    // show the message card  app_name: chat-app
    expect(queryByText('chat-app'))?.toBeDefined()

    // loading status: waiting for response, can't keypress
    expect(
      getByRole('button').attributes.getNamedItem('disabled')
    ).toBeDefined()

    // show the stop generate button
    const stopButton = queryByText('Stop generating')
    expect(stopButton).toBeDefined()
    expect(stopButton?.attributes.getNamedItem('disabled')).toBeDefined()
  })

  test('test chat when click button to send msg', async () => {
    const { getByPlaceholderText, queryByText, getByRole } = component
    const button = getByRole('button')

    fireEvent.click(button)
    // loading status: waiting for response, can't keypress
    expect(
      getByRole('button').attributes.getNamedItem('disabled')
    ).toBeDefined()

    // show the stop generate button
    const stopButton = queryByText('Stop generating')
    expect(stopButton?.attributes.getNamedItem('disabled')).toBeFalsy()
  })

  // test('test useChat', async () => {
  //   const { result } = renderHook(() =>
  //     useChat({
  //       id: 'test-chat',
  //       body: {
  //         appId: 'YhTq4Xx29aDZ',
  //         sessionId: 'srQuAKvgZR7W',
  //         apiSessionId: '21486acbbd393f8a6131a9009d6aae4d',
  //       },
  //     })
  //   )

  //   expect(result?.current?.isLoading).toBeFalsy()
  //   expect(result?.current?.messages).toHaveLength(0)
  // })
})
