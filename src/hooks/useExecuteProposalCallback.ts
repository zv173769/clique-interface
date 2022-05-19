import { calculateGasMargin } from 'utils'
import { TransactionResponse } from '@ethersproject/providers'
import { useCallback } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useActiveWeb3React } from '.'
import { useVotingContract } from './useContract'

export function useExecuteProposalCallback(votingAddress: string | undefined, tagKey: string) {
  const addTransaction = useTransactionAdder()
  const votingContract = useVotingContract(votingAddress)
  const { account } = useActiveWeb3React()

  return useCallback(
    (id: string) => {
      if (!account) throw new Error('none account')
      if (!votingContract || !votingAddress) throw new Error('none votingContract')

      return votingContract.estimateGas.executeProposal(id, { from: account }).then(estimatedGasLimit => {
        return votingContract
          .executeProposal(id, {
            gasLimit: calculateGasMargin(estimatedGasLimit),
            // gasLimit: '3500000',
            from: account
          })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: 'Execute proposal',
              tag: {
                type: 'proposalExec',
                key: tagKey,
                id: votingAddress
              }
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, tagKey, votingAddress, votingContract]
  )
}
